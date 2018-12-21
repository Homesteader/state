import { func, assert, log, random } from './util';
import { Vertex } from './Vertex';
import { PseudoStateKind } from './PseudoStateKind';
import { Region } from './Region';
import { State } from './State';
import { Transition } from './Transition';
import { TransitionKind } from './TransitionKind';


/**
 * A pseudo state is a transient elemement within a state machine, once entered it will evaluate outgoing transitions and attempt to exit.
 * @public
 */
export class PseudoState implements Vertex {
	public readonly parent: Region;

	/**
	 * The fully qualified name of the vertex including its parent's qualified name.
	 * @public
	 */
	public readonly qualifiedName: string;

	/**
	 * The outgoing transitions available from this vertex.
	 */
	outgoing: Array<Transition> = [];

	/** 
	 * The else transition that may be used by branch pseudo states; saves the costly process of searching for it at runtime.
	 * @internal 
	 */
	elseTransition: Transition | undefined;

	/**
	 * Creates a new instance of the PseudoState class.
	 * @param name The name of the pseudo state.
	 * @param parent The parent region of the pseudo state; a state may also be specified in which case the state's default region will be used as the parent region.
	 * @param kind The kind of pseudo state; this defines its behaviour and use. See PseudoStateKind for more information.
	 * @public
	 */
	public constructor(public readonly name: string, parent: State | Region, public readonly kind: PseudoStateKind = PseudoStateKind.Initial) {
		this.parent = parent instanceof State ? parent.getDefaultRegion() : parent;
		this.qualifiedName = `${this.parent}.${this.name}`;

		// if this is a starting state (initial, deep or shallow history), record it against the parent region
		if (this.kind === PseudoStateKind.Initial || this.isHistory()) {
			assert.ok(!this.parent.starting, () => `Only one initial pseudo state is allowed in region ${this.parent}`);

			this.parent.starting = this;
		}

		this.parent.children.unshift(this);

		log.info(() => `Created ${this.kind} pseudo state ${this}`, log.Create);
	}

	/**
	 * Tests a pseudo state to see if is is a history pseudo state
	 * @returns Returns true if the pseudo state is of the deep or shallow history kind
	 */
	isHistory(): boolean {
		return this.kind === PseudoStateKind.DeepHistory || this.kind === PseudoStateKind.ShallowHistory;
	}

	/**
	 * Creates a new transition with a type test.
	 * @remarks Once creates with the [[Vertex.on]] method, the transition can be enhanced using the fluent API calls of [[Transition.if]], [[Transition.to]]/[[Transition.local]] and [[Transition.do]].
	 * @param type The type of event that this transition will look for.
	 * @returns Returns the newly created transition.
	 * @public
	 */
	public on<TTrigger>(type: func.Constructor<TTrigger>): Transition<TTrigger> {
		return new Transition<TTrigger>(this, undefined, TransitionKind.internal, type);
	}

	public when<TTrigger>(guard: func.Predicate<TTrigger>): Transition<TTrigger> {
		return new Transition<TTrigger>(this, undefined, TransitionKind.internal, undefined, guard);
	}

	/**
	 * Creates a new transition with a target vertex.
	 * @remarks Once creates with the [[Vertex.tn]] method, the transition can be enhanced using the fluent API calls of [[Transition.on]] [[Transition.if]], [[Transition.local]] and [[Transition.do]]. If an event test is needed, create the transition with the [[on]] method.
	 * @param to The target vertex of the transition.
	 * @returns Returns the newly created transition.
	 * @public
	 */
	public to<TTrigger>(target: Vertex): Transition<TTrigger> {
		return new Transition<TTrigger>(this, target, TransitionKind.external);
	}

	/**
	 * Creates an else transition from Junction or Choice pseudo states.
	 * @param to The target vertex of the transition.
	 * @returns Returns the newly created transition.
	 * @public
	 */
	public else<TTrigger>(target: Vertex): Transition<TTrigger> {
		assert.ok(this.kind === PseudoStateKind.Choice || this.kind === PseudoStateKind.Junction, () => `Else transitions are only valid at Choice and Junction pseudo states`);
		assert.ok(!this.elseTransition, () => `Only 1 else transition allowed at ${this}`);

		return this.elseTransition = new Transition<TTrigger>(this, target, TransitionKind.external, undefined, () => false);
	}

	/** Find a transition from the pseudo state for a given trigger event */
	getTransition(trigger: any): Transition | undefined {
		// find all transitions whose guard conditions evaluate true for the trigger
		let transitions = this.outgoing.filter(transition => transition.evaluate(trigger));

		// validate we didn't get too many
		assert.ok(this.kind === PseudoStateKind.Choice || transitions.length <= 1, () => `Multiple transitions found at ${this} for ${trigger}`);

		// select the appropriate transition
		let result = (this.kind === PseudoStateKind.Choice ? transitions[random.get(transitions.length)] : transitions[0] ) || this.elseTransition;

		// validate we have something to return
		assert.ok(result, () => `Unable to find transition at ${this} for ${trigger}`);

		return result!;
	}

	/**
	 * Returns the fully qualified name of the pseudo state.
	 * @public
	 */
	public toString(): string {
		return this.qualifiedName;
	}
}