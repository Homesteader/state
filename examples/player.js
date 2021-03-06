"use strict";
exports.__esModule = true;
//import * as state from "@steelbreeze/state";
var state = require("../lib/node");
state.log.add(function (message) { return console.info(message); }, state.log.Entry | state.log.Exit);
// create the state machine model elements
var model = new state.State("model");
var initial = new state.PseudoState("initial", model, state.PseudoStateKind.Initial);
var operational = new state.State("operational", model);
var flipped = new state.State("flipped", model);
var finalState = new state.State("final", model);
var deepHistory = new state.PseudoState("history", operational, state.PseudoStateKind.DeepHistory);
var stopped = new state.State("stopped", operational);
var active = new state.State("active", operational).entry(function (trigger) { return console.log("- Engage head due to " + trigger); }).exit(function (trigger) { return console.log("- Disengage head due to " + trigger); });
var running = new state.State("running", active).entry(function (trigger) { return console.log("- Start motor due to " + trigger); }).exit(function (trigger) { return console.log("- Stop motor due to " + trigger); });
var paused = new state.State("paused", active);
// create the state machine model transitions
initial.to(operational);
deepHistory.to(stopped);
stopped.on(String).when(function (trigger) { return trigger === "play"; }).to(running);
active.on(String).when(function (trigger) { return trigger === "stop"; }).to(stopped);
running.on(String).when(function (trigger) { return trigger === "pause"; }).to(paused);
paused.on(String).when(function (trigger) { return trigger === "play"; }).to(running);
operational.on(String).when(function (trigger) { return trigger === "flip"; }).to(flipped);
flipped.on(String).when(function (trigger) { return trigger === "flip"; }).to(operational);
operational.on(String).when(function (trigger) { return trigger === "off"; }).to(finalState);
// create a new state machine instance (this stores the active state configuration, allowing many instances to work with a single model)
var instance = new state.Instance("player", model);
// send messages to the state machine to cause state transitions
instance.evaluate("play");
instance.evaluate("pause");
instance.evaluate("flip");
instance.evaluate("flip");
