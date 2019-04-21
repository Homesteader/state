/**
 * Specifies the behaviour of transitions.
 */
export declare enum TransitionKind {
    /** External transitions are the default transition type; the source vertex is exited, transition behaviour performed and the target entered. */
    External = 0,
    /** An internal transition does not exit the source state; it only performs transition behaviour. */
    Internal = 1,
    /** A Local transition is one where the target vertex is in the child structure of the source; the source state is not exited. */
    Local = 2
}
