"use strict";
/**
 * @module state
 *
 * a finite state machine library
 *
 * @copyright (c) 2014-7 David Mesquita-Morris
 *
 * Licensed under the MIT and GPL v3 licences
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
/** Import other packages */
var graph_1 = require("@steelbreeze/graph");
var delegate_1 = require("@steelbreeze/delegate");
var log_1 = require("./log");
var random_1 = require("./random");
/**
 * Default setting for completion transition behavior.
 * @hidden
 */
var internalTransitionsTriggerCompletion = false;
/**
 * Sets a flag controlling completion transition behavior for internal transitions.
 * @param value True to have internal transitions trigger completion transitions.
 * @return Returns the previous setting in use.
 */
function setInternalTransitionsTriggerCompletion(value) {
    var result = internalTransitionsTriggerCompletion;
    internalTransitionsTriggerCompletion = value;
    return result;
}
exports.setInternalTransitionsTriggerCompletion = setInternalTransitionsTriggerCompletion;
/**
 * The seperator used when generating fully qualified names.
 * @hidden
 */
var namespaceSeparator = ".";
/**
 * Sets the symbol used as the delimiter in fully qualified element names.
 * @param value The symbol used as the delimiter in fully qualified element names.
 * @return Returns the previous symbol used as the delimiter in fully qualified element names.
 */
function setNamespaceSeparator(value) {
    var result = namespaceSeparator;
    namespaceSeparator = value;
    return result;
}
exports.setNamespaceSeparator = setNamespaceSeparator;
/**
 * The seperator used when generating fully qualified names.
 * @hidden
 */
var defaultRegionName = "default";
/**
 * Sets the default name to use when implicitly creating regions.
 * @param value The new default region name.
 * @return Returns the previous default region name.
 */
function setDefaultRegionName(value) {
    var result = defaultRegionName;
    defaultRegionName = value;
    return result;
}
exports.setDefaultRegionName = setDefaultRegionName;
/**
 * Enumeration used to define the semantics of [pseudo states]{@link PseudoState}.
 */
var PseudoStateKind;
(function (PseudoStateKind) {
    /*** Turns the [pseudo state]{@link PseudoState} into a dynamic conditional branch: the guard conditions of the outgoing [transitions]{@link Transition} will be evaluated after the transition into the [pseudo state]{@link PseudoState} is traversed. */
    PseudoStateKind[PseudoStateKind["Choice"] = 0] = "Choice";
    /** Turns on deep history semantics for the parent [region]{@link Region}: second and subsiquent entry of the parent [region]{@link Region} will use the last known state from the active state configuration contained withn the [state machine instance]{@link IInstance} as the initial state; this behavior will cascade through all child [regions]{@link Region}. */
    PseudoStateKind[PseudoStateKind["DeepHistory"] = 1] = "DeepHistory";
    /*** Turns the [pseudo state]{@link PseudoState} into an initial [vertex]{@link Vertex}, meaning is is the default point when the parent [region]{@link Region} is entered. */
    PseudoStateKind[PseudoStateKind["Initial"] = 2] = "Initial";
    /*** Turns the [pseudo state]{@link PseudoState} into a static conditional branch: the guard conditions of the outgoing [transitions]{@link Transition} will be evaluated before the transition into the [pseudo state]{@link PseudoState} is traversed. */
    PseudoStateKind[PseudoStateKind["Junction"] = 3] = "Junction";
    /** Turns on shallow history semantics for the parent [region]{@link Region}: second and subsiquent entry of the parent [region]{@link Region} will use the last known state from the active state configuration contained withn the [state machine instance]{@link IInstance} as the initial state; this behavior will only apply to the parent [region]{@link Region}. */
    PseudoStateKind[PseudoStateKind["ShallowHistory"] = 4] = "ShallowHistory"; // = "ShallowHistory"
})(PseudoStateKind = exports.PseudoStateKind || (exports.PseudoStateKind = {}));
(function (PseudoStateKind) {
    /**
     * Tests a [pseudo state kind]{@link PseudoStateKind} to see if it is one of the history kinds.
     * @param kind The [pseudo state kind]{@link PseudoStateKind} to test.
     * @return Returns true if the [pseudo state kind]{@link PseudoStateKind} is [DeepHistory]{@link PseudoStateKind.DeepHistory} or [ShallowHistory]{@link PseudoStateKind.ShallowHistory}
     */
    function isHistory(kind) {
        return kind === PseudoStateKind.DeepHistory || kind === PseudoStateKind.ShallowHistory;
    }
    PseudoStateKind.isHistory = isHistory;
    /**
     * Tests a [pseudo state kind]{@link PseudoStateKind} to see if it is one of the initial kinds.
     * @param kind The [pseudo state kind]{@link PseudoStateKind} to test.
     * @return Returns true if the [pseudo state kind]{@link PseudoStateKind} is [Initial]{@link PseudoStateKind.Initial}, [DeepHistory]{@link PseudoStateKind.DeepHistory} or [ShallowHistory]{@link PseudoStateKind.ShallowHistory}
     */
    function isInitial(kind) {
        return kind === PseudoStateKind.DeepHistory || kind === PseudoStateKind.Initial || kind === PseudoStateKind.ShallowHistory;
    }
    PseudoStateKind.isInitial = isInitial;
})(PseudoStateKind = exports.PseudoStateKind || (exports.PseudoStateKind = {}));
/**
 * Enumeration used to define the semantics of [transitions]{@link Transition}.
 */
var TransitionKind;
(function (TransitionKind) {
    /** An external [transition]{@link Transition} is the default transition type; the source [vertex]{@link Vertex} is exited, [transition]{@link Transition} behavior called and target [vertex]{@link Vertex} entered. Where the source and target [vertices]{@link Vertex} are in different parent [regions]{@link Region} the source ancestry is exited up to but not including the least common ancestor; likewise the targe ancestry is enterd. */
    TransitionKind[TransitionKind["External"] = 0] = "External";
    /**
     * An internal [transition]{@link Transition} executes without exiting or entering the [state]{@link State} in which it is defined.
     * @note The target vertex of an internal [transition]{@link Transition} must be undefined.
     */
    TransitionKind[TransitionKind["Internal"] = 1] = "Internal";
    /** A local [transition]{@link Transition} is one where the target [vertex]{@link Vertex} is a child of the source [vertex]{@link Vertex}; the source [vertex]{@link Vertex} is not exited. */
    TransitionKind[TransitionKind["Local"] = 2] = "Local"; // = "Local"
})(TransitionKind = exports.TransitionKind || (exports.TransitionKind = {}));
/**
 * Common base class for [regions]{@link Region} and [vertices]{@link Vertex} within a [state machine model]{@link StateMachine}.
 * @param TParent The type of the element's parent.
 */
var NamedElement = (function () {
    /**
     * Creates a new instance of the [[NamedElement]] class.
     * @param name The name of this [element]{@link NamedElement}.
     * @param parent The parent [element]{@link IElement} of this [element]{@link NamedElement}.
     */
    function NamedElement(name, parent) {
        this.name = name;
        this.parent = parent;
        this.invalidate();
    }
    /**
     * Invalidates a [state machine model]{@link StateMachine} causing it to require recompilation.
     * @hidden
     */
    NamedElement.prototype.invalidate = function () {
        this.parent.invalidate();
    };
    /** Returns the fully qualified name of the [element]{@link NamedElement}. */
    NamedElement.prototype.toString = function () {
        return this.parent.toString() + namespaceSeparator + this.name;
    };
    return NamedElement;
}());
exports.NamedElement = NamedElement;
/** A region is an orthogonal part of either a [composite state]{@link State} or a [state machine]{@link StateMachine}. It is container of [vertices]{@link Vertex} and has no behavior associated with it. */
var Region = (function (_super) {
    __extends(Region, _super);
    /**
     * Creates a new instance of the [[Region]] class.
     * @param name The name of this [element]{@link NamedElement}.
     * @param parent The parent [element]{@link IElement} of this [element]{@link NamedElement}.
     */
    function Region(name, parent) {
        var _this = _super.call(this, name, parent) || this;
        /** The child [vertices]{@link Vertex} of this [region]{@link Region}. */
        _this.children = new Array();
        _this.parent.children.push(_this);
        return _this;
    }
    /**
     * Tests a given [state machine instance]{@link IInstance} to see if this [region]{@link Region} is active. A [region]{@link Region} is active when it has been entered but not exited.
     * @param instance The [state machine instance]{@link IInstance} to test if this [region]{@link Region} is active within.
     * @return Returns true if the [region]{@link Region} is active.
     */
    Region.prototype.isActive = function (instance) {
        return this.parent.isActive(instance);
    };
    /**
     * Tests a given [state machine instance]{@link IInstance} to see if this [region]{@link Region} is complete. A [region]{@link Region} is complete when it's current active [state]{@link State} is a [final state]{@link State.isFinal} (one that has no outbound [transitions]{@link Transition}.
     * @param instance The [state machine instance]{@link IInstance} to test if this [region]{@link Region} is complete within.
     * @return Returns true if the [region]{@link Region} is complete.
     */
    Region.prototype.isComplete = function (instance) {
        var currentState = instance.getLastKnownState(this);
        return currentState !== undefined && currentState.isFinal();
    };
    /**
     * Accepts a [visitor]{@link Visitor} object.
     * @param visitor The [visitor]{@link Visitor} object.
     * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
     */
    Region.prototype.accept = function (visitor) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return visitor.visitRegion.apply(visitor, [this].concat(args));
    };
    return Region;
}(NamedElement));
exports.Region = Region;
/** The source or target of a [transition]{@link Transition} within a [state machine model]{@link StateMachine}. A vertex can be either a [[State]] or a [[PseudoState]]. */
var Vertex = (function (_super) {
    __extends(Vertex, _super);
    /**
     * Creates a new instance of the [[Vertex]] class.
     * @param name The name of this [vertex]{@link Vertex}.
     * @param parent The parent [element]{@link IElement} of this [vertex]{@link Vertex}. If a [state]{@link State} or [state machine]{@link StateMachine} is specified, its [default region]{@link State.defaultRegion} used as the parent.
     */
    function Vertex(name, parent) {
        var _this = _super.call(this, name, parent instanceof Region ? parent : parent.defaultRegion() || new Region(defaultRegionName, parent)) || this;
        /** The set of possible [transitions]{@link Transition} that this [vertex]{@link Vertex} can be the source of. */
        _this.outgoing = new Array();
        /** The set of possible [transitions]{@link Transition} that this [vertex]{@link Vertex} can be the target of. */
        _this.incoming = new Array();
        _this.parent.children.push(_this);
        return _this;
    }
    /**
     * Creates a new [transition]{@link Transition} from this [vertex]{@link Vertex}.
     * @param target The [vertex]{@link Vertex} to [transition]{@link Transition} to. Leave this as undefined to create an [internal transition]{@link TransitionKind.Internal}.
     * @param kind The kind of the [transition]{@link Transition}; use this to explicitly set [local transition]{@link TransitionKind.Local} semantics as needed.
     */
    Vertex.prototype.to = function (target, kind) {
        if (kind === void 0) { kind = TransitionKind.External; }
        return new Transition(this, target, kind);
    };
    return Vertex;
}(NamedElement));
exports.Vertex = Vertex;
/** A [vertex]{@link Vertex} in a [state machine model]{@link StateMachine} that has the form of a [state]{@link State} but does not behave as a full [state]{@link State}; it is always transient; it may be the source or target of [transitions]{@link Transition} but has no entry or exit behavior. */
var PseudoState = (function (_super) {
    __extends(PseudoState, _super);
    /**
     * Creates a new instance of the [[PseudoState]] class.
     * @param name The name of this [pseudo state]{@link PseudoState}.
     * @param parent The parent [element]{@link IElement} of this [pseudo state]{@link PseudoState}. If a [state]{@link State} or [state machine]{@link StateMachine} is specified, its [default region]{@link State.defaultRegion} used as the parent.
     * @param kind The semantics of this [pseudo state]{@link PseudoState}; see the members of the [pseudo state kind enumeration]{@link PseudoStateKind} for details.
     */
    function PseudoState(name, parent, kind) {
        if (kind === void 0) { kind = PseudoStateKind.Initial; }
        var _this = _super.call(this, name, parent) || this;
        _this.kind = kind;
        return _this;
    }
    /**
     * Accepts a [visitor]{@link Visitor} object.
     * @param visitor The [visitor]{@link Visitor} object.
     * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
     */
    PseudoState.prototype.accept = function (visitor) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return visitor.visitPseudoState.apply(visitor, [this].concat(args));
    };
    return PseudoState;
}(Vertex));
exports.PseudoState = PseudoState;
/** A condition or situation during the life of an object, represented by a [state machine model]{@link StateMachine}, during which it satisfies some condition, performs some activity, or waits for some event. */
var State = (function (_super) {
    __extends(State, _super);
    /**
     * Creates a new instance of the [[State]] class.
     * @param name The name of this [state]{@link State}.
     * @param parent The parent [element]{@link IElement} of this [state]{@link State}. If a [state]{@link State} or [state machine]{@link StateMachine} is specified, its [default region]{@link State.defaultRegion} used as the parent.
     */
    function State(name, parent) {
        var _this = _super.call(this, name, parent) || this;
        /** The child [region(s)]{@link Region} if this [state]{@link State} is a [composite]{@link State.isComposite} or [orthogonal]{@link State.isOrthogonal} state. */
        _this.children = new Array();
        /**
         * The state's entry behavior as defined by the user.
         * @hidden
         */
        _this.entryBehavior = delegate_1.create();
        /**
         * The state's exit behavior as defined by the user.
         * @hidden
         */
        _this.exitBehavior = delegate_1.create();
        return _this;
    }
    /**
     * The default [region]{@link Region} used by state.js when it implicitly creates them. [Regions]{@link Region} are implicitly created if a [vertex]{@link Vertex} specifies the [state]{@link State} as its parent.
     * @return Returns the default [region]{@link Region} if present or undefined.
     */
    State.prototype.defaultRegion = function () {
        return this.children.filter(function (region) { return region.name === defaultRegionName; })[0];
    };
    /**
     * Tests the [state]{@link State} to to see if it is a final state. Final states have no [outgoing]{@link State.outgoing} [transitions]{@link Transition} and cause their parent [region]{@link Region} to be considered [complete]{@link Region.isComplete}.
     * @return Returns true if the [state]{@link State} is a final state.
     */
    State.prototype.isFinal = function () {
        return this.outgoing.length === 0;
    };
    /**
     * Tests the [state]{@link State} to to see if it is a simple state. Simple states have no child [regions]{@link Region}.
     * @return Returns true if the [state]{@link State} is a simple state.
     */
    State.prototype.isSimple = function () {
        return this.children.length === 0;
    };
    /**
     * Tests the [state]{@link State} to to see if it is a composite state. Composite states have one or more child [regions]{@link Region}.
     * @return Returns true if the [state]{@link State} is a composite state.
     */
    State.prototype.isComposite = function () {
        return this.children.length > 0;
    };
    /**
     * Tests the [state]{@link State} to to see if it is an orthogonal state. Orthogonal states have two or more child [regions]{@link Region}.
     * @return Returns true if the [state]{@link State} is an orthogonal state.
     */
    State.prototype.isOrthogonal = function () {
        return this.children.length > 1;
    };
    /**
     * Tests a given [state machine instance]{@link IInstance} to see if this [state]{@link State} is active. A [state]{@link State} is active when it has been entered but not exited.
     * @param instance The [state machine instance]{@link IInstance} to test if this [state]{@link State} is active within.
     * @return Returns true if the [region]{@link Region} is active.
     */
    State.prototype.isActive = function (instance) {
        return this.parent.isActive(instance) && instance.getLastKnownState(this.parent) === this;
    };
    /**
     * Tests a given [state machine instance]{@link IInstance} to see if this [state]{@link State} is complete. A [state]{@link State} is complete when all its [child]{@link State.children} [regions]{@link Region} are [complete]{@link Region.isComplete}.
     * @param instance The [state machine instance]{@link IInstance} to test if this [state]{@link State} is complete within.
     * @return Returns true if the [region]{@link Region} is complete.
     */
    State.prototype.isComplete = function (instance) {
        return this.children.every(function (region) { return region.isComplete(instance); });
    };
    /**
     * Sets user-definable behavior to execute every time the [state]{@link State} is exited.
     * @param action The behavior to call upon [state]{@link State} exit. Mutiple calls to this method may be made to build complex behavior.
     * @return Returns the [state]{@link State} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
     */
    State.prototype.exit = function (action) {
        this.exitBehavior = delegate_1.create(this.exitBehavior, function (instance, deepHistory) {
            var message = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                message[_i - 2] = arguments[_i];
            }
            return action.apply(void 0, [instance].concat(message));
        });
        this.invalidate();
        return this;
    };
    /**
     * Sets user-definable behavior to execute every time the [state]{@link State} is entered.
     * @param action The behavior to call upon [state]{@link State} entry. Mutiple calls to this method may be made to build complex behavior.
     * @return Returns the [state]{@link State} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
     */
    State.prototype.entry = function (action) {
        this.entryBehavior = delegate_1.create(this.entryBehavior, function (instance, deepHistory) {
            var message = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                message[_i - 2] = arguments[_i];
            }
            return action.apply(void 0, [instance].concat(message));
        });
        this.invalidate();
        return this;
    };
    /**
     * Accepts a [visitor]{@link Visitor} object.
     * @param visitor The [visitor]{@link Visitor} object.
     * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
     */
    State.prototype.accept = function (visitor) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return visitor.visitState.apply(visitor, [this].concat(args));
    };
    return State;
}(Vertex));
exports.State = State;
/** A specification of the sequences of [states]{@link State} that an object goes through in response to events during its life, together with its responsive actions. */
var StateMachine = (function () {
    /**
     * Creates a new instance of the [[StateMachine]] class.
     * @param name The name of the [state machine]{@link StateMachine}.
     */
    function StateMachine(name) {
        this.name = name;
        /**
         * The parent element of the state machine; always undefined.
         * @hidden
         */
        this.parent = undefined;
        /** The child [region(s)]{@link Region} if this [state machine]{@link StateMachine}. */
        this.children = new Array();
        /**
         * The set of actions to perform when initialising a state machine instance; enters all the child regions.
         * @hidden
         */
        this.onInitialise = delegate_1.create();
    }
    /**
     * Invalidates a [state machine model]{@link StateMachine} causing it to require recompilation.
     * @hidden
     */
    StateMachine.prototype.invalidate = function () {
        this.onInitialise = delegate_1.create();
    };
    /**
     * The default [region]{@link Region} used by state.js when it implicitly creates them. [Regions]{@link Region} are implicitly created if a [vertex]{@link Vertex} specifies the [state machine]{@link StateMachine} as its parent.
     * @return Returns the default [region]{@link Region} if present or undefined.
     */
    StateMachine.prototype.defaultRegion = function () {
        return this.children.filter(function (region) { return region.name === defaultRegionName; })[0];
    };
    /**
     * Tests the [state machine instance]{@link IInstance} to see if it is active. As a [state machine]{@link StateMachine} is the root of the model, it will always be active.
     * @param instance The [state machine instance]{@link IInstance} to test.
     * @returns Always returns true.
     */
    StateMachine.prototype.isActive = function (instance) {
        return true;
    };
    /**
     * Tests a given [state machine instance]{@link IInstance} to see if it is complete. A [state machine]{@link StateMachine} is complete when all its [child]{@link StateMachine.children} [regions]{@link Region} are [complete]{@link Region.isComplete}.
     * @param instance The [state machine instance]{@link IInstance} to test.
     * @return Returns true if the [state machine instance]{@link IInstance} is complete.
     */
    StateMachine.prototype.isComplete = function (instance) {
        return this.children.every(function (region) { return region.isComplete(instance); });
    };
    /**
     * Initialises a [state machine model]{@link StateMachine} or a [state machine instance]{@link IInstance}.
     * @param instance The [state machine instance]{@link IInstance} to initialise; if omitted, the [state machine model]{@link StateMachine} is initialised.
     */
    StateMachine.prototype.initialise = function (instance) {
        if (instance) {
            if (this.onInitialise === delegate_1.create()) {
                this.initialise();
            }
            log_1.logger.log("initialise " + instance);
            this.onInitialise(instance, false);
        }
        else {
            log_1.logger.log("initialise " + this);
            this.onInitialise = this.accept(new Runtime(), false);
        }
    };
    /**
     * Passes a message to the [state machine model]{@link StateMachine} for evaluation within the context of a specific [state machine instance]{@link IInstance}.
     * @param instance The [state machine instance]{@link IInstance} to evaluate the message against.
     * @param message An arbitory number of objects that form the message. These will be passed to the [guard conditions]{@link Guard} of the appropriate [transitions]{@link Transition} and if a state transition occurs, to the behaviour specified on [states]{@link State} and [transitions]{@link Transition}.
     */
    StateMachine.prototype.evaluate = function (instance) {
        var message = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            message[_i - 1] = arguments[_i];
        }
        if (this.onInitialise === delegate_1.create()) {
            this.initialise();
        }
        log_1.logger.log(instance + " evaluate message: " + message);
        return Runtime.evaluate.apply(Runtime, [this, instance].concat(message));
    };
    /**
     * Accepts a [visitor]{@link Visitor} object.
     * @param visitor The [visitor]{@link Visitor} object.
     * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
     */
    StateMachine.prototype.accept = function (visitor) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return visitor.visitStateMachine.apply(visitor, [this].concat(args));
    };
    /** Returns the fully name of the [state machine]{@link StateMachine}. */
    StateMachine.prototype.toString = function () {
        return this.name;
    };
    return StateMachine;
}());
exports.StateMachine = StateMachine;
/** A relationship within a [state machine model]{@link StateMachine} between two [vertices]{@link Vertex} that will effect a state transition in response to an event when its [guard condition]{@link Transition.when} is satisfied. */
var Transition = (function () {
    /**
     * Creates an instance of the [[Transition]] class.
     * @param source The [vertex]{@link Vertex} to [transition]{@link Transition} from.
     * @param target The [vertex]{@link Vertex} to [transition]{@link Transition} to. Leave this as undefined to create an [internal transition]{@link TransitionKind.Internal}.
     * @param kind The kind of the [transition]{@link Transition}; use this to explicitly set [local transition]{@link TransitionKind.Local} semantics as needed.
     */
    function Transition(source, target, kind) {
        if (kind === void 0) { kind = TransitionKind.External; }
        var _this = this;
        this.source = source;
        this.target = target;
        this.kind = kind;
        /**
         * The transition's behavior as defined by the user.
         * @hidden
         */
        this.effectBehavior = delegate_1.create();
        /**
         * The compiled behavior to effect the state transition.
         * @hidden
         */
        this.onTraverse = delegate_1.create();
        this.guard = source instanceof PseudoState ? function () { return true; } : function (instance) {
            var message = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                message[_i - 1] = arguments[_i];
            }
            return message[0] === _this.source;
        };
        this.source.outgoing.push(this);
        // validate and repair if necessary the user supplied transition kind
        if (this.target) {
            this.target.incoming.push(this);
            if (this.kind === TransitionKind.Local) {
                if (!graph_1.Tree.isChild(this.target, this.source)) {
                    this.kind = TransitionKind.External;
                }
            }
        }
        else {
            this.kind = TransitionKind.Internal;
        }
        this.source.invalidate();
    }
    /**
     * Tests the [transition]{@link Transition} to see if it is an [else transition]{@link Transition.else}.
     * @return Returns true if the [transition]{@link Transition} is an [else transition]{@link Transition.else}.
     */
    Transition.prototype.isElse = function () {
        return this.guard === Transition.Else;
    };
    /**
     * Turns the [transition]{@link Transition} into an [else transition]{@link Transition.isElse}.
     * @return Returns the [transition]{@link Transition} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
     */
    Transition.prototype["else"] = function () {
        // TODO: validate that the source is a choice or junction.
        this.guard = Transition.Else;
        return this;
    };
    /**
     * Create a user defined [guard condition]{@link Guard} for the [transition]{@link Transition}.
     * @param guard The new [guard condition]{@link Guard}.
     * @return Returns the [transition]{@link Transition} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
     */
    Transition.prototype.when = function (guard) {
        this.guard = guard;
        return this;
    };
    /**
     * Sets user-definable behavior to execute every time the [transition]{@link Transition} is traversed.
     * @param action The behavior to call upon [transition]{@link Transition} traversal. Mutiple calls to this method may be made to build complex behavior.
     * @return Returns the [transition]{@link Transition} to facilitate fluent-style [state machine model]{@link StateMachine} construction.
     */
    Transition.prototype.effect = function (action) {
        this.effectBehavior = delegate_1.create(this.effectBehavior, function (instance, deepHistory) {
            var message = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                message[_i - 2] = arguments[_i];
            }
            return action.apply(void 0, [instance].concat(message));
        });
        this.source.invalidate();
        return this;
    };
    /**
     * Evaulates the [transitions]{@link Transition} guard condition.
     * @param instance The [state machine instance]{@link IInstance} to evaluate the message against.
     * @param message An arbitory number of objects that form the message.
     * @hidden
     */
    Transition.prototype.evaluate = function (instance) {
        var message = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            message[_i - 1] = arguments[_i];
        }
        return this.guard.apply(this, [instance].concat(message));
    };
    /**
     * Accepts a [visitor]{@link Visitor} object.
     * @param visitor The [visitor]{@link Visitor} object.
     * @param args Any optional arguments to pass into the [visitor]{@link Visitor} object.
     */
    Transition.prototype.accept = function (visitor) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return visitor.visitTransition.apply(visitor, [this].concat(args));
    };
    /**
     * A guard to represent else transitions.
     * @hidden
     */
    Transition.Else = function () { return false; };
    return Transition;
}());
exports.Transition = Transition;
/** Base class for vistors that will walk the [state machine model]{@link StateMachine}; used in conjunction with the [accept]{@linkcode StateMachine.accept} methods on all [elements]{@link IElement}. Visitor is an mplementation of the [visitor pattern]{@link https://en.wikipedia.org/wiki/Visitor_pattern}. */
var Visitor = (function () {
    function Visitor() {
    }
    /**
     * Visits an [element]{@link IElement} within a [state machine model]{@link StateMachine}; use this for logic applicable to all [elements]{@link IElement}.
     * @param element The [element]{@link IElement} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    Visitor.prototype.visitElement = function (element) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
    };
    /**
     * Visits a [region]{@link Region} within a [state machine model]{@link StateMachine}.
     * @param element The [reigon]{@link Region} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    Visitor.prototype.visitRegion = function (region) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        for (var _a = 0, _b = region.children; _a < _b.length; _a++) {
            var vertex = _b[_a];
            vertex.accept.apply(vertex, [this].concat(args));
        }
        return this.visitElement.apply(this, [region].concat(args));
    };
    /**
     * Visits a [vertex]{@link Vertex} within a [state machine model]{@link StateMachine}; use this for logic applicable to all [vertices]{@link Vertex}.
     * @param vertex The [vertex]{@link Vertex} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    Visitor.prototype.visitVertex = function (vertex) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        for (var _a = 0, _b = vertex.outgoing; _a < _b.length; _a++) {
            var transition = _b[_a];
            transition.accept.apply(transition, [this].concat(args));
        }
        return this.visitElement.apply(this, [vertex].concat(args));
    };
    /**
     * Visits a [pseudo state]{@link PseudoState} within a [state machine model]{@link StateMachine}.
     * @param element The [pseudo state]{@link PseudoState} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    Visitor.prototype.visitPseudoState = function (pseudoState) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return this.visitVertex.apply(this, [pseudoState].concat(args));
    };
    /**
     * Visits a [state]{@link State} within a [state machine model]{@link StateMachine}.
     * @param element The [state]{@link State} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    Visitor.prototype.visitState = function (state) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        for (var _a = 0, _b = state.children; _a < _b.length; _a++) {
            var region = _b[_a];
            region.accept.apply(region, [this].concat(args));
        }
        return this.visitVertex.apply(this, [state].concat(args));
    };
    /**
     * Visits a [state machine]{@link StateMachine} within a [state machine model]{@link StateMachine}.
     * @param element The [state machine]{@link StateMachine} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    Visitor.prototype.visitStateMachine = function (stateMachine) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        for (var _a = 0, _b = stateMachine.children; _a < _b.length; _a++) {
            var region = _b[_a];
            region.accept.apply(region, [this].concat(args));
        }
        return this.visitElement.apply(this, [stateMachine].concat(args));
    };
    /**
     * Visits a [transition]{@link Transition} within a [state machine model]{@link StateMachine}.
     * @param element The [transition]{@link Transition} being visited.
     * @param args The arguments passed to the initial accept call.
     */
    Visitor.prototype.visitTransition = function (transition) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
    };
    return Visitor;
}());
exports.Visitor = Visitor;
var StateConfiguration = (function () {
    function StateConfiguration(name) {
        this.name = name;
        this.children = new Array();
    }
    return StateConfiguration;
}());
var RegionConfiguration = (function () {
    function RegionConfiguration(name) {
        this.name = name;
        this.children = new Array();
    }
    return RegionConfiguration;
}());
var JSONInstance = (function () {
    function JSONInstance(name) {
        this.root = new StateConfiguration(name);
    }
    JSONInstance.prototype.getStateConfiguration = function (state) {
        var stateConfiguration = this.root;
        if (state.parent !== undefined) {
            var regionConfiguration = this.getRegionConfiguration(state.parent);
            stateConfiguration = regionConfiguration.children.filter(function (s) { return s.name === state.name; })[0];
            if (stateConfiguration === undefined) {
                stateConfiguration = new StateConfiguration(state.name);
                regionConfiguration.children.push(stateConfiguration);
            }
        }
        return stateConfiguration;
    };
    JSONInstance.prototype.getRegionConfiguration = function (region) {
        var stateConfiguration = this.getStateConfiguration(region.parent);
        var regionConfiguration = stateConfiguration.children.filter(function (r) { return r.name === region.name; })[0];
        if (regionConfiguration === undefined) {
            regionConfiguration = new RegionConfiguration(region.name);
            stateConfiguration.children.push(regionConfiguration);
        }
        return regionConfiguration;
    };
    JSONInstance.prototype.setCurrent = function (vertex) {
        var regionConfiguration = this.getRegionConfiguration(vertex.parent);
        regionConfiguration.current = vertex.name;
        if (vertex instanceof State) {
            regionConfiguration.lastKnownState = vertex.name;
        }
    };
    JSONInstance.prototype.getCurrent = function (region) {
        var regionConfiguration = this.getRegionConfiguration(region);
        return region.children.filter(function (vertex) { return vertex.name === regionConfiguration.current; })[0];
    };
    JSONInstance.prototype.getLastKnownState = function (region) {
        var regionConfiguration = this.getRegionConfiguration(region);
        var lastKnownState;
        for (var _i = 0, _a = region.children; _i < _a.length; _i++) {
            var vertex = _a[_i];
            if (vertex instanceof State) {
                if (vertex.name === regionConfiguration.lastKnownState) {
                    lastKnownState = vertex;
                }
            }
        }
        return lastKnownState;
    };
    JSONInstance.prototype.toJSON = function () {
        return JSON.stringify(this.root);
    };
    JSONInstance.prototype.toString = function () {
        return this.root.name;
    };
    return JSONInstance;
}());
exports.JSONInstance = JSONInstance;
/** Simple implementation of [[IInstance]]; manages the active state configuration in a dictionary. */
var DictionaryInstance = (function () {
    function DictionaryInstance(name) {
        this.name = name;
        this.lastState = new Map();
        this.currentVertex = new Map();
    }
    DictionaryInstance.prototype.setCurrent = function (vertex) {
        this.currentVertex.set(vertex.parent, vertex);
        if (vertex instanceof State) {
            this.lastState.set(vertex.parent, vertex);
        }
    };
    DictionaryInstance.prototype.getCurrent = function (region) {
        return this.currentVertex.get(region);
    };
    DictionaryInstance.prototype.getLastKnownState = function (region) {
        return this.lastState.get(region);
    };
    DictionaryInstance.prototype.toString = function () {
        return this.name;
    };
    return DictionaryInstance;
}());
exports.DictionaryInstance = DictionaryInstance;
/** @hidden */
var RuntimeActions = (function () {
    function RuntimeActions() {
        this.leave = delegate_1.create();
        this.beginEnter = delegate_1.create();
        this.endEnter = delegate_1.create();
    }
    return RuntimeActions;
}());
/** @hidden */
var Runtime = (function (_super) {
    __extends(Runtime, _super);
    function Runtime() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.actions = new Map();
        _this.transitions = new Array();
        return _this;
    }
    Runtime.prototype.getActions = function (elemenet) {
        var result = this.actions.get(elemenet);
        if (result) {
            return result;
        }
        else {
            var newResult = new RuntimeActions();
            this.actions.set(elemenet, newResult);
            return newResult;
        }
    };
    Runtime.prototype.visitElement = function (element, deepHistoryAbove) {
        this.getActions(element).leave = delegate_1.create(this.getActions(element).leave, function (instance) { return log_1.logger.log(instance + " leave " + element); });
        this.getActions(element).beginEnter = delegate_1.create(this.getActions(element).beginEnter, function (instance) { return log_1.logger.log(instance + " enter " + element); });
    };
    Runtime.prototype.visitRegion = function (region, deepHistoryAbove) {
        var _this = this;
        var regionInitial = region.children.reduce(function (result, vertex) { return vertex instanceof PseudoState && PseudoStateKind.isInitial(vertex.kind) && (result === undefined || PseudoStateKind.isHistory(result.kind)) ? vertex : result; }, undefined);
        this.getActions(region).leave = delegate_1.create(this.getActions(region).leave, function (instance, deepHistory) {
            var message = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                message[_i - 2] = arguments[_i];
            }
            (_a = _this.getActions(instance.getCurrent(region))).leave.apply(_a, [instance, deepHistory].concat(message));
            var _a;
        });
        _super.prototype.visitRegion.call(this, region, deepHistoryAbove || (regionInitial && regionInitial.kind === PseudoStateKind.DeepHistory)); // TODO: determine if we need to break this up or move it
        if (deepHistoryAbove || !regionInitial || PseudoStateKind.isHistory(regionInitial.kind)) {
            this.getActions(region).endEnter = delegate_1.create(this.getActions(region).endEnter, function (instance, deepHistory) {
                var message = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    message[_i - 2] = arguments[_i];
                }
                var actions = _this.getActions((deepHistory || PseudoStateKind.isHistory(regionInitial.kind)) ? instance.getLastKnownState(region) || regionInitial : regionInitial);
                var history = deepHistory || regionInitial.kind === PseudoStateKind.DeepHistory;
                actions.beginEnter.apply(actions, [instance, history].concat(message));
                actions.endEnter.apply(actions, [instance, history].concat(message));
            });
        }
        else {
            this.getActions(region).endEnter = delegate_1.create(this.getActions(regionInitial).beginEnter, this.getActions(regionInitial).endEnter);
        }
    };
    Runtime.prototype.visitVertex = function (vertex, deepHistoryAbove) {
        _super.prototype.visitVertex.call(this, vertex, deepHistoryAbove);
        this.getActions(vertex).beginEnter = delegate_1.create(this.getActions(vertex).beginEnter, function (instance) {
            instance.setCurrent(vertex);
        });
    };
    Runtime.prototype.visitPseudoState = function (pseudoState, deepHistoryAbove) {
        var _this = this;
        _super.prototype.visitPseudoState.call(this, pseudoState, deepHistoryAbove);
        if (PseudoStateKind.isInitial(pseudoState.kind)) {
            this.getActions(pseudoState).endEnter = delegate_1.create(this.getActions(pseudoState).endEnter, function (instance, deepHistory) {
                var message = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    message[_i - 2] = arguments[_i];
                }
                var currentState;
                if ((PseudoStateKind.isHistory(pseudoState.kind) || deepHistory) && (currentState = instance.getLastKnownState(pseudoState.parent))) {
                    (_a = _this.getActions(pseudoState)).leave.apply(_a, [instance, false].concat(message));
                    (_b = _this.getActions(currentState)).beginEnter.apply(_b, [instance, deepHistory || pseudoState.kind === PseudoStateKind.DeepHistory].concat(message));
                    (_c = _this.getActions(currentState)).endEnter.apply(_c, [instance, deepHistory || pseudoState.kind === PseudoStateKind.DeepHistory].concat(message));
                }
                else {
                    Runtime.traverse(pseudoState.outgoing[0], instance, false);
                }
                var _a, _b, _c;
            });
        }
    };
    Runtime.prototype.visitState = function (state, deepHistoryAbove) {
        for (var _i = 0, _a = state.children; _i < _a.length; _i++) {
            var region = _a[_i];
            region.accept(this, deepHistoryAbove);
            this.getActions(state).leave = delegate_1.create(this.getActions(state).leave, this.getActions(region).leave);
            this.getActions(state).endEnter = delegate_1.create(this.getActions(state).endEnter, this.getActions(region).beginEnter, this.getActions(region).endEnter);
        }
        this.visitVertex(state, deepHistoryAbove);
        this.getActions(state).leave = delegate_1.create(this.getActions(state).leave, state.exitBehavior);
        this.getActions(state).beginEnter = delegate_1.create(this.getActions(state).beginEnter, state.entryBehavior);
    };
    Runtime.prototype.visitStateMachine = function (stateMachine, deepHistoryAbove) {
        var _this = this;
        _super.prototype.visitStateMachine.call(this, stateMachine, deepHistoryAbove);
        for (var _i = 0, _a = this.transitions; _i < _a.length; _i++) {
            var transition = _a[_i];
            switch (transition.kind) {
                case TransitionKind.Internal:
                    this.visitInternalTransition(transition);
                    break;
                case TransitionKind.Local:
                    this.visitLocalTransition(transition);
                    break;
                case TransitionKind.External:
                    this.visitExternalTransition(transition);
                    break;
            }
        }
        return delegate_1.create.apply(void 0, stateMachine.children.map(function (region) { return delegate_1.create(_this.getActions(region).beginEnter, _this.getActions(region).endEnter); }));
    };
    Runtime.prototype.visitTransition = function (transition, deepHistoryAbove) {
        _super.prototype.visitTransition.call(this, transition, deepHistoryAbove);
        this.transitions.push(transition);
    };
    Runtime.prototype.visitInternalTransition = function (transition) {
        transition.onTraverse = delegate_1.create(transition.effectBehavior);
        if (internalTransitionsTriggerCompletion) {
            transition.onTraverse = delegate_1.create(transition.onTraverse, function (instance, deepHistory) {
                var message = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    message[_i - 2] = arguments[_i];
                }
                if (transition.source instanceof State && transition.source.isComplete(instance)) {
                    Runtime.evaluate(transition.source, instance, transition.source);
                }
            });
        }
    };
    Runtime.prototype.visitLocalTransition = function (transition) {
        var _this = this;
        transition.onTraverse = delegate_1.create(function (instance, deepHistory) {
            var message = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                message[_i - 2] = arguments[_i];
            }
            var vertex = transition.target;
            var actions = delegate_1.create(_this.getActions(transition.target).endEnter);
            while (vertex !== transition.source) {
                actions = delegate_1.create(_this.getActions(vertex).beginEnter, actions);
                if (vertex.parent.parent === transition.source) {
                    actions = delegate_1.create(transition.effectBehavior, _this.getActions(instance.getCurrent(vertex.parent)).leave, actions);
                }
                else {
                    actions = delegate_1.create(_this.getActions(vertex.parent).beginEnter, actions); // TODO: validate this is the correct place for region entry
                }
                vertex = vertex.parent.parent;
            }
            actions.apply(void 0, [instance, deepHistory].concat(message));
        });
    };
    Runtime.prototype.visitExternalTransition = function (transition) {
        var sourceAncestors = graph_1.Tree.ancestors(transition.source);
        var targetAncestors = graph_1.Tree.ancestors(transition.target);
        var i = graph_1.Tree.lowestCommonAncestorIndex(sourceAncestors, targetAncestors);
        if (sourceAncestors[i] instanceof Region) {
            i += 1;
        }
        transition.onTraverse = delegate_1.create(this.getActions(sourceAncestors[i]).leave, transition.effectBehavior);
        while (i < targetAncestors.length) {
            transition.onTraverse = delegate_1.create(transition.onTraverse, this.getActions(targetAncestors[i++]).beginEnter);
        }
        transition.onTraverse = delegate_1.create(transition.onTraverse, this.getActions(transition.target).endEnter);
    };
    Runtime.findElse = function (pseudoState) {
        return pseudoState.outgoing.filter(function (transition) { return transition.isElse(); })[0];
    };
    Runtime.selectTransition = function (pseudoState, instance) {
        var message = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            message[_i - 2] = arguments[_i];
        }
        var transitions = pseudoState.outgoing.filter(function (transition) { return transition.evaluate.apply(transition, [instance].concat(message)); });
        if (pseudoState.kind === PseudoStateKind.Choice) {
            return transitions.length !== 0 ? transitions[random_1.random(transitions.length)] : this.findElse(pseudoState);
        }
        if (transitions.length > 1) {
            log_1.logger.error("Multiple outbound transition guards returned true at " + pseudoState + " for " + message);
        }
        return transitions[0] || this.findElse(pseudoState);
    };
    Runtime.evaluate = function (state, instance) {
        var message = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            message[_i - 2] = arguments[_i];
        }
        var result = false;
        if (message[0] !== state) {
            state.children.every(function (region) {
                var currentState = instance.getLastKnownState(region);
                if (currentState && Runtime.evaluate.apply(Runtime, [currentState, instance].concat(message))) {
                    result = true;
                    return state.isActive(instance);
                }
                return true;
            });
        }
        if (state instanceof State) {
            if (result) {
                if ((message[0] !== state) && state.isComplete(instance)) {
                    Runtime.evaluate(state, instance, state);
                }
            }
            else {
                var transitions = state.outgoing.filter(function (transition) { return transition.evaluate.apply(transition, [instance].concat(message)); });
                if (transitions.length === 1) {
                    Runtime.traverse.apply(Runtime, [transitions[0], instance].concat(message));
                    result = true;
                }
                else if (transitions.length > 1) {
                    log_1.logger.error(state + ": multiple outbound transitions evaluated true for message " + message);
                }
            }
        }
        return result;
    };
    Runtime.traverse = function (transition, instance) {
        var message = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            message[_i - 2] = arguments[_i];
        }
        var onTraverse = delegate_1.create(transition.onTraverse);
        // create the compound transition while the target is a junction pseudo state (static conditional branch)
        while (transition.target && transition.target instanceof PseudoState && transition.target.kind === PseudoStateKind.Junction) {
            transition = Runtime.selectTransition.apply(Runtime, [transition.target, instance].concat(message));
            onTraverse = delegate_1.create(onTraverse, transition.onTraverse);
        }
        // call the transition behavior.
        onTraverse.apply(void 0, [instance, false].concat(message));
        if (transition.target) {
            // recurse to perform outbound transitions when the target is a choice pseudo state (dynamic conditional branch)
            if (transition.target instanceof PseudoState && transition.target.kind === PseudoStateKind.Choice) {
                Runtime.traverse.apply(Runtime, [Runtime.selectTransition.apply(Runtime, [transition.target, instance].concat(message)), instance].concat(message));
            }
            else if (transition.target instanceof State && transition.target.isComplete(instance)) {
                Runtime.evaluate(transition.target, instance, transition.target);
            }
        }
    };
    return Runtime;
}(Visitor));
