import { types, NamedElement, State, Region, Instance, Visitor } from '.';
declare class JSONNode {
    readonly name: String;
    constructor(element: NamedElement);
}
declare class JSONState extends JSONNode {
    deferredEventPool: Array<any> | undefined;
    readonly children: Array<JSONRegion>;
}
declare class JSONRegion extends JSONNode {
    readonly activeState: string | undefined;
    readonly children: Array<JSONState>;
    constructor(region: Region, activeState: string | undefined);
}
export declare class JSONSerializer extends Visitor {
    private readonly instance;
    private readonly deferedEventSerializer;
    root: JSONState | undefined;
    private stateMap;
    private regionMap;
    constructor(instance: Instance, deferedEventSerializer?: types.Function<any, any> | undefined);
    visitStateHead(state: State): void;
    visitRegionHead(region: Region): void;
    toString(): string;
}
export {};