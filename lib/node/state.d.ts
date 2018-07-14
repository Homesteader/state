import { Delegate } from '@steelbreeze/delegate';
import { PseudoStateKind } from './PseudoStateKind';
import { TransitionKind } from './TransitionKind';
/** Common properties of all elements that make up a [state machine model]{@link StateMachine}. */
export interface IElement {
    /** Invalidates a [state machine model]{@link StateMachine} causing it to require recompilation. */
    invalidate(): void;
}
/** Common base class for [regions]{@link Region} and [vertices]{@link Vertex} within a [state machine model]{@link StateMachine}.
 * @param TParent The type of the element's parent.
 */
export declare abstract class NamedElement<TParent extends IElement> implements IElement {
    readonly name: string;
    readonly parent: TParent;
    /** The string used to seperate elements of a namespace */
    static separator: string;
    /** Creates a new instance of the [[NamedElement]] class.
     * @param name The name of this [element]{@link NamedElement}.
     * @param parent The parent [element]{@link IElement} of this [element]{@link NamedElement}.
     */
    protected constructor(name: string, parent: TParent);
    /** Invalidates a [state machine model]{@link StateMachine} causing it to require recompilation.
     * @hidden
     */
    invalidate(): void;
    /** Accepts a [visitor]{@link Visitor} object.
     * @param visitor The [visitor]{@link Visitor} object.
     * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
     */
    abstract accept(visitor: Visitor, ...args: any[]): any;
    /** Returns the fully qualified name of the [element]{@link NamedElement}. */
    toString(): string;
}
/** A region is an orthogonal part of either a [composite state]{@link State} or a [state machine]{@link StateMachine}. It is container of [vertices]{@link Vertex} and has no behavior associated with it. */
export declare class Region extends NamedElement<State | StateMachine> {
    /** The default name of regions that are dynamically created. */
    static defaultName: string;
    /** The child [vertices]{@link Vertex} of this [region]{@link Region}. */
    readonly children: Vertex[];
    /** Creates a new instance of the [[Region]] class.
     * @param name The name of this [element]{@link NamedElement}.
     * @param parent The parent [element]{@link IElement} of this [element]{@link NamedElement}.
     */
    constructor(name: string, parent: State | StateMachine);
    /** Tests a given [state machine instance]{@link IInstance} to see if this [region]{@link Region} is active. A [region]{@link Region} is active when it has been entered but not exited.
     * @param instance The [state machine instance]{@link IInstance} to test if this [region]{@link Region} is active within.
     * @return Returns true if the [region]{@link Region} is active.
     */
    isActive(instance: IInstance): boolean;
    /** Tests a given [state machine instance]{@link IInstance} to see if this [region]{@link Region} is complete. A [region]{@link Region} is complete when it's current active [state]{@link State} is a [final state]{@link State.isFinal} (one that has no outbound [transitions]{@link Transition}.
     * @param instance The [state machine instance]{@link IInstance} to test if this [region]{@link Region} is complete within.
     * @return Returns true if the [region]{@link Region} is complete.
     */
    isComplete(instance: IInstance): boolean;
    /** Accepts a [visitor]{@link Visitor} object.
     * @param visitor The [visitor]{@link Visitor} object.
     * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
     */
    accept(visitor: Visitor, ...args: any[]): any;
}
/** The source or target of a [transition]{@link Transition} within a [state machine model]{@link StateMachine}. A vertex can be either a [[State]] or a [[PseudoState]]. */
export declare abstract class Vertex extends NamedElement<Region> {
    /** The set of possible [transitions]{@link Transition} that this [vertex]{@link Vertex} can be the source of. */
    readonly outgoing: Transition[];
    /** The set of possible [transitions]{@link Transition} that this [vertex]{@link Vertex} can be the target of. */
    readonly incoming: Transition[];
    /** Creates a new instance of the [[Vertex]] class.
     * @param name The name of this [vertex]{@link Vertex}.
     * @param parent The parent [element]{@link IElement} of this [vertex]{@link Vertex}. If a [state]{@link State} or [state machine]{@link StateMachine} is specified, its [default region]{@link State.defaultRegion} used as the parent.
     */
    protected constructor(name: string, parent: Region | State | StateMachine);
    /** Creates a new [transition]{@link Transition} from this [vertex]{@link Vertex}.
     * @param target The [vertex]{@link Vertex} to [transition]{@link Transition} to. Leave this as undefined to create an [internal transition]{@link TransitionKind.Internal}.
     * @param kind The kind of the [transition]{@link Transition}; use this to explicitly set [local transition]{@link TransitionKind.Local} semantics as needed.
     */
    to(target?: Vertex, kind?: TransitionKind): Transition;
}
/** A [vertex]{@link Vertex} in a [state machine model]{@link StateMachine} that has the form of a [state]{@link State} but does not behave as a full [state]{@link State}; it is always transient; it may be the source or target of [transitions]{@link Transition} but has no entry or exit behavior. */
export declare class PseudoState extends Vertex {
    readonly kind: PseudoStateKind;
    /** Creates a new instance of the [[PseudoState]] class.
     * @param name The name of this [pseudo state]{@link PseudoState}.
     * @param parent The parent [element]{@link IElement} of this [pseudo state]{@link PseudoState}. If a [state]{@link State} or [state machine]{@link StateMachine} is specified, its [default region]{@link State.defaultRegion} used as the parent.
     * @param kind The semantics of this [pseudo state]{@link PseudoState}; see the members of the [pseudo state kind enumeration]{@link PseudoStateKind} for details.
     */
    constructor(name: string, parent: Region | State | StateMachine, kind?: PseudoStateKind);
    /** Accepts a [visitor]{@link Visitor} object.
     * @param visitor The [visitor]{@link Visitor} object.
     * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
     */
    accept(visitor: Visitor, ...args: any[]): any;
}
/** A condition or situation during the life of an object, represented by a [state machine model]{@link StateMachine}, during which it satisfies some condition, performs some activity, or waits for some event. */
export declare class State extends Vertex {
    /** The child [region(s)]{@link Region} if this [state]{@link State} is a [composite]{@link State.isComposite} or [orthogonal]{@link State.isOrthogonal} state. */
    readonly children: Region[];
    /** The state's entry behavior as defined by the user.
     * @hidden
     */
    entryBehavior: Delegate;
    /** The state's exit behavior as defined by the user.
     * @hidden
     */
    exitBehavior: Delegate;
    /** Creates a new instance of the [[State]] class.
     * @param name The name of this [state]{@link State}.
     * @param parent The parent [element]{@link IElement} of this [state]{@link State}. If a [state]{@link State} or [state machine]{@link StateMachine} is specified, its [default region]{@link State.defaultRegion} used as the parent.
     */
    constructor(name: string, parent: Region | State | StateMachine);
    /** Tests the [state]{@link State} to to see if it is a final state. Final states have no [outgoing]{@link State.outgoing} [transitions]{@link Transition} and cause their parent [region]{@link Region} to be considered [complete]{@link Region.isComplete}.
     * @return Returns true if the [state]{@link State} is a final state.
     */
    isFinal(): boolean;
    /** Tests the [state]{@link State} to to see if it is a simple state. Simple states have no child [regions]{@link Region}.
     * @return Returns true if the [state]{@link State} is a simple state.
     */
    isSimple(): boolean;
    /** Tests the [state]{@link State} to to see if it is a composite state. Composite states have one or more child [regions]{@link Region}.
     * @return Returns true if the [state]{@link State} is a composite state.
     */
    isComposite(): boolean;
    /** Tests the [state]{@link State} to to see if it is an orthogonal state. Orthogonal states have two or more child [regions]{@link Region}.
     * @return Returns true if the [state]{@link State} is an orthogonal state.
     */
    isOrthogonal(): boolean;
    /** Tests a given [state machine instance]{@link IInstance} to see if this [state]{@link State} is active. A [state]{@link State} is active when it has been entered but not exited.
     * @param instance The [state machine instance]{@link IInstance} to test if this [state]{@link State} is active within.
     * @return Returns true if the [region]{@link Region} is active.
     */
    isActive(instance: IInstance): boolean;
    /** Sets user-definable behavior to execute every time the [state]{@link State} is exited.
     * @param action The behavior to call upon [state]{@link State} exit. Mutiple calls to this method may be made to build complex behavior.
     * @return Returns the [state]{@link State} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
     */
    exit(action: (instance: IInstance, ...message: any[]) => any): this;
    /** Sets user-definable behavior to execute every time the [state]{@link State} is entered.
     * @param action The behavior to call upon [state]{@link State} entry. Mutiple calls to this method may be made to build complex behavior.
     * @return Returns the [state]{@link State} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
     */
    entry(action: (instance: IInstance, ...message: any[]) => any): this;
    /** Accepts a [visitor]{@link Visitor} object.
     * @param visitor The [visitor]{@link Visitor} object.
     * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
     */
    accept(visitor: Visitor, ...args: any[]): any;
    /** The default [region]{@link Region} used by state.js when it implicitly creates them. [Regions]{@link Region} are implicitly created if a [vertex]{@link Vertex} specifies the [state]{@link State} as its parent.
     * @return Returns the default [region]{@link Region} if present or undefined.
     */
    defaultRegion(): Region | undefined;
    /** Tests a given [state machine instance]{@link IInstance} to see if this [state]{@link State} is complete. A [state]{@link State} is complete when all its [child]{@link State.children} [regions]{@link Region} are [complete]{@link Region.isComplete}.
     * @param instance The [state machine instance]{@link IInstance} to test if this [state]{@link State} is complete within.
     * @return Returns true if the [region]{@link Region} is complete.
     */
    isComplete(instance: IInstance): boolean;
}
/** A specification of the sequences of [states]{@link State} that an object goes through in response to events during its life, together with its responsive actions. */
export declare class StateMachine implements IElement {
    readonly name: string;
    /** The parent element of the state machine; always undefined.
     * @hidden
     */
    readonly parent: undefined;
    /** The child [region(s)]{@link Region} if this [state]{@link State} is a [composite]{@link State.isComposite} or [orthogonal]{@link State.isOrthogonal} state. */
    readonly children: Region[];
    /** The set of actions to perform when initialising a state machine instance; enters all the child regions.
     * @hidden
     */
    private onInitialise;
    /** Creates a new instance of the [[StateMachine]] class.
     * @param name The name of the [state machine]{@link StateMachine}.
     */
    constructor(name: string);
    /** Invalidates a [state machine model]{@link StateMachine} causing it to require recompilation.
     * @hidden
     */
    invalidate(): void;
    /** Tests the [state machine instance]{@link IInstance} to see if it is active. As a [state machine]{@link StateMachine} is the root of the model, it will always be active.
     * @param instance The [state machine instance]{@link IInstance} to test.
     * @returns Always returns true.
     */
    isActive(instance: IInstance): boolean;
    /** Initialises a [state machine model]{@link StateMachine} or a [state machine instance]{@link IInstance}.
     * @param instance The [state machine instance]{@link IInstance} to initialise; if omitted, the [state machine model]{@link StateMachine} is initialised.
     */
    initialise(instance?: IInstance): void;
    /** Passes a message to the [state machine model]{@link StateMachine} for evaluation within the context of a specific [state machine instance]{@link IInstance}.
     * @param instance The [state machine instance]{@link IInstance} to evaluate the message against.
     * @param message An arbitory number of objects that form the message. These will be passed to the [guard conditions]{@link Guard} of the appropriate [transitions]{@link Transition} and if a state transition occurs, to the behaviour specified on [states]{@link State} and [transitions]{@link Transition}.
     */
    evaluate(instance: IInstance, ...message: any[]): boolean;
    /** Accepts a [visitor]{@link Visitor} object.
     * @param visitor The [visitor]{@link Visitor} object.
     * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
     */
    accept(visitor: Visitor, ...args: any[]): any;
    /** Returns the fully name of the [state machine]{@link StateMachine}. */
    toString(): string;
    /** The default [region]{@link Region} used by state.js when it implicitly creates them. [Regions]{@link Region} are implicitly created if a [vertex]{@link Vertex} specifies the [state]{@link State} as its parent.
     * @return Returns the default [region]{@link Region} if present or undefined.
     */ defaultRegion(): Region | undefined;
    /** Tests a given [state machine instance]{@link IInstance} to see if this [state]{@link State} is complete. A [state]{@link State} is complete when all its [child]{@link State.children} [regions]{@link Region} are [complete]{@link Region.isComplete}.
     * @param instance The [state machine instance]{@link IInstance} to test if this [state]{@link State} is complete within.
     * @return Returns true if the [region]{@link Region} is complete.
     */
    isComplete(instance: IInstance): boolean;
}
/** A relationship within a [state machine model]{@link StateMachine} between two [vertices]{@link Vertex} that will effect a state transition in response to an event when its [guard condition]{@link Transition.when} is satisfied. */
export declare class Transition {
    readonly source: Vertex;
    readonly target?: Vertex | undefined;
    readonly kind: TransitionKind;
    /** Default setting for completion transition behavior. */
    static internalTransitionsTriggerCompletion: boolean;
    /** A guard to represent else transitions.
     * @hidden
     */
    private static Else;
    /** The transition's behavior as defined by the user.
     * @hidden
     */
    effectBehavior: Delegate;
    /** The compiled behavior to effect the state transition.
     * @hidden
     */
    onTraverse: Delegate;
    /** The transition's guard condition; initially a completion transition, but may be overriden by the user with calls to when and else.
     * @hidden
     */
    private guard;
    /** Creates an instance of the [[Transition]] class.
     * @param source The [vertex]{@link Vertex} to [transition]{@link Transition} from.
     * @param target The [vertex]{@link Vertex} to [transition]{@link Transition} to. Leave this as undefined to create an [internal transition]{@link TransitionKind.Internal}.
     * @param kind The kind of the [transition]{@link Transition}; use this to explicitly set [local transition]{@link TransitionKind.Local} semantics as needed.
     */
    constructor(source: Vertex, target?: Vertex | undefined, kind?: TransitionKind);
    /** Tests the [transition]{@link Transition} to see if it is an [else transition]{@link Transition.else}.
     * @return Returns true if the [transition]{@link Transition} is an [else transition]{@link Transition.else}.
     */
    isElse(): boolean;
    /** Turns the [transition]{@link Transition} into an [else transition]{@link Transition.isElse}.
     * @return Returns the [transition]{@link Transition} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
     */
    else(): this;
    /** Create a user defined [guard condition]{@link Guard} for the [transition]{@link Transition}.
     * @param guard The new [guard condition]{@link Guard}.
     * @return Returns the [transition]{@link Transition} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
     */
    when(guard: (instance: IInstance, ...message: any[]) => boolean): this;
    /** Sets user-definable behavior to execute every time the [transition]{@link Transition} is traversed.
     * @param action The behavior to call upon [transition]{@link Transition} traversal. Mutiple calls to this method may be made to build complex behavior.
     * @return Returns the [transition]{@link Transition} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
     */
    effect(action: (instance: IInstance, ...message: any[]) => any): this;
    /** Evaulates the [transitions]{@link Transition} guard condition.
     * @param instance The [state machine instance]{@link IInstance} to evaluate the message against.
     * @param message An arbitory number of objects that form the message.
     * @hidden
     */
    evaluate(instance: IInstance, ...message: any[]): boolean;
    /** Accepts a [visitor]{@link Visitor} object.
     * @param visitor The [visitor]{@link Visitor} object.
     * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
     */
    accept(visitor: Visitor, ...args: any[]): any;
}
/** Base class for vistors that will walk the [state machine model]{@link StateMachine}; used in conjunction with the [accept]{@linkcode StateMachine.accept} methods on all [elements]{@link IElement}. Visitor is an mplementation of the [visitor pattern]{@link https://en.wikipedia.org/wiki/Visitor_pattern}. */
export declare abstract class Visitor {
    /** Visits an [element]{@link IElement} within a [state machine model]{@link StateMachine}; use this for logic applicable to all [elements]{@link IElement}.
     * @param element The [element]{@link IElement} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    visitElement<TElement extends IElement>(element: TElement, ...args: any[]): any;
    /** Visits a [region]{@link Region} within a [state machine model]{@link StateMachine}.
     * @param element The [reigon]{@link Region} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    visitRegion(region: Region, ...args: any[]): any;
    /** Visits a [vertex]{@link Vertex} within a [state machine model]{@link StateMachine}; use this for logic applicable to all [vertices]{@link Vertex}.
     * @param vertex The [vertex]{@link Vertex} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    visitVertex(vertex: Vertex, ...args: any[]): any;
    /** Visits a [pseudo state]{@link PseudoState} within a [state machine model]{@link StateMachine}.
     * @param element The [pseudo state]{@link PseudoState} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    visitPseudoState(pseudoState: PseudoState, ...args: any[]): any;
    /** Visits a [state]{@link State} within a [state machine model]{@link StateMachine}.
     * @param element The [state]{@link State} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    visitState(state: State, ...args: any[]): any;
    /** Visits a [state machine]{@link StateMachine} within a [state machine model]{@link StateMachine}.
     * @param element The [state machine]{@link StateMachine} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    visitStateMachine(stateMachine: StateMachine, ...args: any[]): any;
    /** Visits a [transition]{@link Transition} within a [state machine model]{@link StateMachine}.
     * @param element The [transition]{@link Transition} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    visitTransition(transition: Transition, ...args: any[]): any;
}
/** Interface to manage the active state configuration of a [state machine instance]{@link IInstance}. Create implementations of this interface to provide control over considerations such as persistence and/or transactionallity. */
export interface IInstance {
    /** Called by state.js upon entry to any [vertex]{@link Vertex}; must store both the current [vertex]{@link Vertex} and last known [state]{@link State} for the [region]{@link Region}.
     * @param vertex The [vertex]{@link Vertex} to record against its parent [region]{@link Region}.
     */
    setCurrent(vertex: Vertex): void;
    /** Called by state.js during [transition]{@link Transition} processing; must return the current [vertex]{@link Vertex} of the [region]{@link Region}.
     * @param region The [region]{@link Region} to retrieve the current state ([vertex]{@link Vertex}) of.
     * @return Returns the current active [vertex]{@link Vertex}.
     */
    getCurrent(region: Region): Vertex | undefined;
    /** Called by state.js during [region]{@link Region} entry; must return the last known [state]{@link State} of the [region]{@link Region}.
     * @param region The [region]{@link Region} to retrieve the last know [state]{@link State} of.
     * @return Returns the last know [state]{@link State}.
     */
    getLastKnownState(region: Region): State | undefined;
}
export declare class JSONInstance implements IInstance {
    private readonly root;
    constructor(name: String);
    private getStateConfiguration;
    private getRegionConfiguration;
    setCurrent(vertex: Vertex): void;
    getCurrent(region: Region): Vertex | undefined;
    getLastKnownState(region: Region): State | undefined;
    toJSON(): string;
    toString(): String;
}
/** Simple implementation of [[IInstance]]; manages the active state configuration in a dictionary. */
export declare class DictionaryInstance implements IInstance {
    readonly name: string;
    private readonly lastState;
    private readonly currentVertex;
    constructor(name: string);
    setCurrent(vertex: Vertex): void;
    getCurrent(region: Region): Vertex | undefined;
    getLastKnownState(region: Region): State | undefined;
    toString(): string;
}
