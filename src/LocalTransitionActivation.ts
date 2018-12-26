import { Vertex } from './Vertex';
import { Instance } from './index';
import { TransitionActivation } from './TransitionActivation';

/**
 * Semantics of local transitions. The elements to exit and enter when traversing a local transition  depend on the active state configuration at the time of traversal.
 */
export class LocalTransitionActivation implements TransitionActivation {
	private toEnter: Vertex | undefined;

	/**
	 * Creates a new instance of the LocalTransitionActivation class.
	 * @param source The source vertex of the local transition.
	 * @param target The target vertex of the local transition.
	 */
	constructor(source: Vertex, public readonly target: Vertex) {
	}

	/**
	 * Exits the source of the transition
	 * @param instance The state machine instance.
	 * @param deepHistory True if deep history semantics are in force at the time of exit.
	 * @param trigger The trigger event that caused the exit operation.
	 */
	exitSource(instance: Instance, deepHistory: boolean, trigger: any): void {
		this.toEnter = this.target;

		// TODO: remove !'s
		// iterate towards the root until we find an active state
		while (this.toEnter!.parent && !this.toEnter!.parent!.parent.isActive(instance)) {
			this.toEnter = this.toEnter!.parent!.parent;
		}

		// TODO: remove !'s
		// exit the currently active vertex in the target vertex's parent region
		if (!this.toEnter!.isActive(instance) && this.toEnter!.parent) {
			instance.getVertex(this.toEnter!.parent!).leave(instance, deepHistory, trigger);
		}
	}

	/**
	 * Exits the target of the transition
	 * @param instance The state machine instance.
	 * @param deepHistory True if deep history semantics are in force at the time of entry.
	 * @param trigger The trigger event that caused the exit operation.
	 */
	enterTarget(instance: Instance, deepHistory: boolean, trigger: any): void {
		if (this.toEnter && !this.toEnter.isActive(instance)) {
			this.toEnter!.enter(instance, deepHistory, trigger);
		}
	}

	/**
	 * Returns the type of the transtiion.
	 */
	public toString(): string {
		return "local";
	}
}
