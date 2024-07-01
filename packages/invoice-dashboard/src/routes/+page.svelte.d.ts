import { SvelteComponent } from "svelte";
declare const __propDef: {
    props: {
        config: any;
        wallet: any;
        requestNetwork?: null | undefined;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type PageProps = typeof __propDef.props;
export type PageEvents = typeof __propDef.events;
export type PageSlots = typeof __propDef.slots;
export default class Page extends SvelteComponent<PageProps, PageEvents, PageSlots> {
}
export {};
