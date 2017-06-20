"use strict";
exports.__esModule = true;
var state = require("../../lib/node/state");
// send log messages, warnings and errors to the console
state.setLogger(console);
// create the state machine model elements
var model = new state.StateMachine("model");
var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var stateA = new state.State("stateA", model);
var stateB = new state.State("stateB", model);
// create the state machine model transitions
initial.to(stateA);
stateA.to(stateB).when(function (instance, message) { return message === "move"; });
// create a state machine instance
var instance = new state.JSONInstance("instance");
// initialise the model and instance
model.initialise(instance);
// send the machine instance a message for evaluation, this will trigger the transition from stateA to stateB
model.evaluate(instance, "move");
console.log(instance.toJSON());
