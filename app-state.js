"use strict";
/* ══════════ STATE ACCESSORS ══════════
   First step of reducing shared mutable globals. `state`, `plan`, `built`, `sticky` and `overrides` still live in app-core.js (older modules use them directly);
   NEW code reads and writes them only through PPState, so a later move to a private store changes this file alone. */
const PPState={
 get:()=>state,
 plan:()=>plan,
 built:()=>built,
 pins:()=>overrides,
 setPins(p){overrides=p&&typeof p==='object'?p:{};},
 clearSticky(){sticky={};},
 patch(o){Object.assign(state,o);},
 course:()=>cid()
};
