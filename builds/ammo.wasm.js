
  // This is ammo.js, a port of Bullet Physics to JavaScript. zlib licensed.
  
var Ammo = (function() {
  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
  return (
function(Ammo) {
  Ammo = Ammo || {};

var Module = typeof Ammo !== "undefined" ? Ammo : {};

var moduleOverrides = {};

var key;

for (key in Module) {
 if (Module.hasOwnProperty(key)) {
  moduleOverrides[key] = Module[key];
 }
}

Module["arguments"] = [];

Module["thisProgram"] = "./this.program";

Module["quit"] = function(status, toThrow) {
 throw toThrow;
};

Module["preRun"] = [];

Module["postRun"] = [];

var ENVIRONMENT_IS_WEB = true;

var ENVIRONMENT_IS_WORKER = false;

var scriptDirectory = "";

function locateFile(path) {
 if (Module["locateFile"]) {
  return Module["locateFile"](path, scriptDirectory);
 } else {
  return scriptDirectory + path;
 }
}

if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
 if (ENVIRONMENT_IS_WORKER) {
  scriptDirectory = self.location.href;
 } else if (document.currentScript) {
  scriptDirectory = document.currentScript.src;
 }
 if (_scriptDir) {
  scriptDirectory = _scriptDir;
 }
 if (scriptDirectory.indexOf("blob:") !== 0) {
  scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1);
 } else {
  scriptDirectory = "";
 }
 Module["read"] = function shell_read(url) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, false);
  xhr.send(null);
  return xhr.responseText;
 };
 if (ENVIRONMENT_IS_WORKER) {
  Module["readBinary"] = function readBinary(url) {
   var xhr = new XMLHttpRequest();
   xhr.open("GET", url, false);
   xhr.responseType = "arraybuffer";
   xhr.send(null);
   return new Uint8Array(xhr.response);
  };
 }
 Module["readAsync"] = function readAsync(url, onload, onerror) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.responseType = "arraybuffer";
  xhr.onload = function xhr_onload() {
   if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
    onload(xhr.response);
    return;
   }
   onerror();
  };
  xhr.onerror = onerror;
  xhr.send(null);
 };
 Module["setWindowTitle"] = function(title) {
  document.title = title;
 };
} else {}

var out = Module["print"] || (typeof console !== "undefined" ? console.log.bind(console) : typeof print !== "undefined" ? print : null);

var err = Module["printErr"] || (typeof printErr !== "undefined" ? printErr : typeof console !== "undefined" && console.warn.bind(console) || out);

for (key in moduleOverrides) {
 if (moduleOverrides.hasOwnProperty(key)) {
  Module[key] = moduleOverrides[key];
 }
}

moduleOverrides = undefined;

var asm2wasmImports = {
 "f64-rem": function(x, y) {
  return x % y;
 },
 "debugger": function() {
  debugger;
 }
};

var functionPointers = new Array(0);

if (typeof WebAssembly !== "object") {
 err("no native wasm support detected");
}

var wasmMemory;

var wasmTable;

var ABORT = false;

var EXITSTATUS = 0;

function assert(condition, text) {
 if (!condition) {
  abort("Assertion failed: " + text);
 }
}

function setValue(ptr, value, type, noSafe) {
 type = type || "i8";
 if (type.charAt(type.length - 1) === "*") type = "i32";
 switch (type) {
 case "i1":
  HEAP8[ptr >> 0] = value;
  break;

 case "i8":
  HEAP8[ptr >> 0] = value;
  break;

 case "i16":
  HEAP16[ptr >> 1] = value;
  break;

 case "i32":
  HEAP32[ptr >> 2] = value;
  break;

 case "i64":
  tempI64 = [ value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
  HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
  break;

 case "float":
  HEAPF32[ptr >> 2] = value;
  break;

 case "double":
  HEAPF64[ptr >> 3] = value;
  break;

 default:
  abort("invalid type for setValue: " + type);
 }
}

var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;

function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
 var endIdx = idx + maxBytesToRead;
 var endPtr = idx;
 while (u8Array[endPtr] && !(endPtr >= endIdx)) ++endPtr;
 if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
  return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
 } else {
  var str = "";
  while (idx < endPtr) {
   var u0 = u8Array[idx++];
   if (!(u0 & 128)) {
    str += String.fromCharCode(u0);
    continue;
   }
   var u1 = u8Array[idx++] & 63;
   if ((u0 & 224) == 192) {
    str += String.fromCharCode((u0 & 31) << 6 | u1);
    continue;
   }
   var u2 = u8Array[idx++] & 63;
   if ((u0 & 240) == 224) {
    u0 = (u0 & 15) << 12 | u1 << 6 | u2;
   } else {
    u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u8Array[idx++] & 63;
   }
   if (u0 < 65536) {
    str += String.fromCharCode(u0);
   } else {
    var ch = u0 - 65536;
    str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
   }
  }
 }
 return str;
}

function UTF8ToString(ptr, maxBytesToRead) {
 return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
}

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
 if (!(maxBytesToWrite > 0)) return 0;
 var startIdx = outIdx;
 var endIdx = outIdx + maxBytesToWrite - 1;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) {
   var u1 = str.charCodeAt(++i);
   u = 65536 + ((u & 1023) << 10) | u1 & 1023;
  }
  if (u <= 127) {
   if (outIdx >= endIdx) break;
   outU8Array[outIdx++] = u;
  } else if (u <= 2047) {
   if (outIdx + 1 >= endIdx) break;
   outU8Array[outIdx++] = 192 | u >> 6;
   outU8Array[outIdx++] = 128 | u & 63;
  } else if (u <= 65535) {
   if (outIdx + 2 >= endIdx) break;
   outU8Array[outIdx++] = 224 | u >> 12;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  } else {
   if (outIdx + 3 >= endIdx) break;
   outU8Array[outIdx++] = 240 | u >> 18;
   outU8Array[outIdx++] = 128 | u >> 12 & 63;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  }
 }
 outU8Array[outIdx] = 0;
 return outIdx - startIdx;
}

function lengthBytesUTF8(str) {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
  if (u <= 127) ++len; else if (u <= 2047) len += 2; else if (u <= 65535) len += 3; else len += 4;
 }
 return len;
}

var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;

var WASM_PAGE_SIZE = 65536;

function alignUp(x, multiple) {
 if (x % multiple > 0) {
  x += multiple - x % multiple;
 }
 return x;
}

var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

function updateGlobalBuffer(buf) {
 Module["buffer"] = buffer = buf;
}

function updateGlobalBufferViews() {
 Module["HEAP8"] = HEAP8 = new Int8Array(buffer);
 Module["HEAP16"] = HEAP16 = new Int16Array(buffer);
 Module["HEAP32"] = HEAP32 = new Int32Array(buffer);
 Module["HEAPU8"] = HEAPU8 = new Uint8Array(buffer);
 Module["HEAPU16"] = HEAPU16 = new Uint16Array(buffer);
 Module["HEAPU32"] = HEAPU32 = new Uint32Array(buffer);
 Module["HEAPF32"] = HEAPF32 = new Float32Array(buffer);
 Module["HEAPF64"] = HEAPF64 = new Float64Array(buffer);
}

var DYNAMIC_BASE = 5271024, DYNAMICTOP_PTR = 27888;

var TOTAL_STACK = 5242880;

var TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 67108864;

if (TOTAL_MEMORY < TOTAL_STACK) err("TOTAL_MEMORY should be larger than TOTAL_STACK, was " + TOTAL_MEMORY + "! (TOTAL_STACK=" + TOTAL_STACK + ")");

if (Module["buffer"]) {
 buffer = Module["buffer"];
} else {
 if (typeof WebAssembly === "object" && typeof WebAssembly.Memory === "function") {
  wasmMemory = new WebAssembly.Memory({
   "initial": TOTAL_MEMORY / WASM_PAGE_SIZE
  });
  buffer = wasmMemory.buffer;
 } else {
  buffer = new ArrayBuffer(TOTAL_MEMORY);
 }
 Module["buffer"] = buffer;
}

updateGlobalBufferViews();

HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;

function callRuntimeCallbacks(callbacks) {
 while (callbacks.length > 0) {
  var callback = callbacks.shift();
  if (typeof callback == "function") {
   callback();
   continue;
  }
  var func = callback.func;
  if (typeof func === "number") {
   if (callback.arg === undefined) {
    Module["dynCall_v"](func);
   } else {
    Module["dynCall_vi"](func, callback.arg);
   }
  } else {
   func(callback.arg === undefined ? null : callback.arg);
  }
 }
}

var __ATPRERUN__ = [];

var __ATINIT__ = [];

var __ATMAIN__ = [];

var __ATPOSTRUN__ = [];

var runtimeInitialized = false;

function preRun() {
 if (Module["preRun"]) {
  if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
  while (Module["preRun"].length) {
   addOnPreRun(Module["preRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
 if (runtimeInitialized) return;
 runtimeInitialized = true;
 callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
 callRuntimeCallbacks(__ATMAIN__);
}

function postRun() {
 if (Module["postRun"]) {
  if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
  while (Module["postRun"].length) {
   addOnPostRun(Module["postRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
 __ATPRERUN__.unshift(cb);
}

function addOnPreMain(cb) {
 __ATMAIN__.unshift(cb);
}

function addOnPostRun(cb) {
 __ATPOSTRUN__.unshift(cb);
}

var Math_abs = Math.abs;

var Math_cos = Math.cos;

var Math_sin = Math.sin;

var Math_ceil = Math.ceil;

var Math_floor = Math.floor;

var Math_min = Math.min;

var runDependencies = 0;

var runDependencyWatcher = null;

var dependenciesFulfilled = null;

function addRunDependency(id) {
 runDependencies++;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
}

function removeRunDependency(id) {
 runDependencies--;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
 if (runDependencies == 0) {
  if (runDependencyWatcher !== null) {
   clearInterval(runDependencyWatcher);
   runDependencyWatcher = null;
  }
  if (dependenciesFulfilled) {
   var callback = dependenciesFulfilled;
   dependenciesFulfilled = null;
   callback();
  }
 }
}

Module["preloadedImages"] = {};

Module["preloadedAudios"] = {};

var dataURIPrefix = "data:application/octet-stream;base64,";

function isDataURI(filename) {
 return String.prototype.startsWith ? filename.startsWith(dataURIPrefix) : filename.indexOf(dataURIPrefix) === 0;
}

var wasmBinaryFile = "ammo.wasm.wasm";

if (!isDataURI(wasmBinaryFile)) {
 wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinary() {
 try {
  if (Module["wasmBinary"]) {
   return new Uint8Array(Module["wasmBinary"]);
  }
  if (Module["readBinary"]) {
   return Module["readBinary"](wasmBinaryFile);
  } else {
   throw "both async and sync fetching of the wasm failed";
  }
 } catch (err) {
  abort(err);
 }
}

function getBinaryPromise() {
 if (!Module["wasmBinary"] && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === "function") {
  return fetch(wasmBinaryFile, {
   credentials: "same-origin"
  }).then(function(response) {
   if (!response["ok"]) {
    throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
   }
   return response["arrayBuffer"]();
  }).catch(function() {
   return getBinary();
  });
 }
 return new Promise(function(resolve, reject) {
  resolve(getBinary());
 });
}

function createWasm(env) {
 var info = {
  "env": env,
  "global": {
   "NaN": NaN,
   Infinity: Infinity
  },
  "global.Math": Math,
  "asm2wasm": asm2wasmImports
 };
 function receiveInstance(instance, module) {
  var exports = instance.exports;
  Module["asm"] = exports;
  removeRunDependency("wasm-instantiate");
 }
 addRunDependency("wasm-instantiate");
 if (Module["instantiateWasm"]) {
  try {
   return Module["instantiateWasm"](info, receiveInstance);
  } catch (e) {
   err("Module.instantiateWasm callback failed with error: " + e);
   return false;
  }
 }
 function receiveInstantiatedSource(output) {
  receiveInstance(output["instance"]);
 }
 function instantiateArrayBuffer(receiver) {
  getBinaryPromise().then(function(binary) {
   return WebAssembly.instantiate(binary, info);
  }).then(receiver, function(reason) {
   err("failed to asynchronously prepare wasm: " + reason);
   abort(reason);
  });
 }
 if (!Module["wasmBinary"] && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && typeof fetch === "function") {
  WebAssembly.instantiateStreaming(fetch(wasmBinaryFile, {
   credentials: "same-origin"
  }), info).then(receiveInstantiatedSource, function(reason) {
   err("wasm streaming compile failed: " + reason);
   err("falling back to ArrayBuffer instantiation");
   instantiateArrayBuffer(receiveInstantiatedSource);
  });
 } else {
  instantiateArrayBuffer(receiveInstantiatedSource);
 }
 return {};
}

Module["asm"] = function(global, env, providedBuffer) {
 env["memory"] = wasmMemory;
 env["table"] = wasmTable = new WebAssembly.Table({
  "initial": 1124,
  "maximum": 1124,
  "element": "anyfunc"
 });
 env["__memory_base"] = 1024;
 env["__table_base"] = 0;
 var exports = createWasm(env);
 return exports;
};

var ASM_CONSTS = [ function($0, $1, $2, $3) {
 var self = Module["getCache"](Module["DebugDrawer"])[$0];
 if (!self.hasOwnProperty("drawLine")) throw "a JSImplementation must implement all functions, you forgot DebugDrawer::drawLine.";
 self["drawLine"]($1, $2, $3);
}, function($0, $1, $2, $3, $4, $5) {
 var self = Module["getCache"](Module["DebugDrawer"])[$0];
 if (!self.hasOwnProperty("drawContactPoint")) throw "a JSImplementation must implement all functions, you forgot DebugDrawer::drawContactPoint.";
 self["drawContactPoint"]($1, $2, $3, $4, $5);
}, function($0, $1) {
 var self = Module["getCache"](Module["DebugDrawer"])[$0];
 if (!self.hasOwnProperty("reportErrorWarning")) throw "a JSImplementation must implement all functions, you forgot DebugDrawer::reportErrorWarning.";
 self["reportErrorWarning"]($1);
}, function($0, $1, $2) {
 var self = Module["getCache"](Module["DebugDrawer"])[$0];
 if (!self.hasOwnProperty("draw3dText")) throw "a JSImplementation must implement all functions, you forgot DebugDrawer::draw3dText.";
 self["draw3dText"]($1, $2);
}, function($0, $1) {
 var self = Module["getCache"](Module["DebugDrawer"])[$0];
 if (!self.hasOwnProperty("setDebugMode")) throw "a JSImplementation must implement all functions, you forgot DebugDrawer::setDebugMode.";
 self["setDebugMode"]($1);
}, function($0) {
 var self = Module["getCache"](Module["DebugDrawer"])[$0];
 if (!self.hasOwnProperty("getDebugMode")) throw "a JSImplementation must implement all functions, you forgot DebugDrawer::getDebugMode.";
 return self["getDebugMode"]();
}, function($0, $1, $2, $3, $4, $5, $6, $7) {
 var self = Module["getCache"](Module["ConcreteContactResultCallback"])[$0];
 if (!self.hasOwnProperty("addSingleResult")) throw "a JSImplementation must implement all functions, you forgot ConcreteContactResultCallback::addSingleResult.";
 return self["addSingleResult"]($1, $2, $3, $4, $5, $6, $7);
} ];

function _emscripten_asm_const_diiiiiiii(code, a0, a1, a2, a3, a4, a5, a6, a7) {
 return ASM_CONSTS[code](a0, a1, a2, a3, a4, a5, a6, a7);
}

function _emscripten_asm_const_iiii(code, a0, a1, a2) {
 return ASM_CONSTS[code](a0, a1, a2);
}

function _emscripten_asm_const_iiiidii(code, a0, a1, a2, a3, a4, a5) {
 return ASM_CONSTS[code](a0, a1, a2, a3, a4, a5);
}

function _emscripten_asm_const_iiiii(code, a0, a1, a2, a3) {
 return ASM_CONSTS[code](a0, a1, a2, a3);
}

function _emscripten_asm_const_ii(code, a0) {
 return ASM_CONSTS[code](a0);
}

function _emscripten_asm_const_iii(code, a0, a1) {
 return ASM_CONSTS[code](a0, a1);
}

__ATINIT__.push({
 func: function() {
  __GLOBAL__sub_I_btQuickprof_cpp();
 }
});

function ___cxa_free_exception(ptr) {
 try {
  return _free(ptr);
 } catch (e) {}
}

var EXCEPTIONS = {
 last: 0,
 caught: [],
 infos: {},
 deAdjust: function(adjusted) {
  if (!adjusted || EXCEPTIONS.infos[adjusted]) return adjusted;
  for (var key in EXCEPTIONS.infos) {
   var ptr = +key;
   var adj = EXCEPTIONS.infos[ptr].adjusted;
   var len = adj.length;
   for (var i = 0; i < len; i++) {
    if (adj[i] === adjusted) {
     return ptr;
    }
   }
  }
  return adjusted;
 },
 addRef: function(ptr) {
  if (!ptr) return;
  var info = EXCEPTIONS.infos[ptr];
  info.refcount++;
 },
 decRef: function(ptr) {
  if (!ptr) return;
  var info = EXCEPTIONS.infos[ptr];
  assert(info.refcount > 0);
  info.refcount--;
  if (info.refcount === 0 && !info.rethrown) {
   if (info.destructor) {
    Module["dynCall_vi"](info.destructor, ptr);
   }
   delete EXCEPTIONS.infos[ptr];
   ___cxa_free_exception(ptr);
  }
 },
 clearRef: function(ptr) {
  if (!ptr) return;
  var info = EXCEPTIONS.infos[ptr];
  info.refcount = 0;
 }
};

function ___cxa_pure_virtual() {
 ABORT = true;
 throw "Pure virtual function called!";
}

var SYSCALLS = {
 buffers: [ null, [], [] ],
 printChar: function(stream, curr) {
  var buffer = SYSCALLS.buffers[stream];
  if (curr === 0 || curr === 10) {
   (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
   buffer.length = 0;
  } else {
   buffer.push(curr);
  }
 },
 varargs: 0,
 get: function(varargs) {
  SYSCALLS.varargs += 4;
  var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
  return ret;
 },
 getStr: function() {
  var ret = UTF8ToString(SYSCALLS.get());
  return ret;
 },
 get64: function() {
  var low = SYSCALLS.get(), high = SYSCALLS.get();
  return low;
 },
 getZero: function() {
  SYSCALLS.get();
 }
};

function ___syscall140(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
  var offset = offset_low;
  FS.llseek(stream, offset, whence);
  HEAP32[result >> 2] = stream.position;
  if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}

function ___syscall146(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.get(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
   var ptr = HEAP32[iov + i * 8 >> 2];
   var len = HEAP32[iov + (i * 8 + 4) >> 2];
   for (var j = 0; j < len; j++) {
    SYSCALLS.printChar(stream, HEAPU8[ptr + j]);
   }
   ret += len;
  }
  return ret;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}

function ___syscall6(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD();
  FS.close(stream);
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}

function _abort() {
 Module["abort"]();
}

function _emscripten_get_heap_size() {
 return TOTAL_MEMORY;
}

function abortOnCannotGrowMemory(requestedSize) {
 abort("Cannot enlarge memory arrays to size " + requestedSize + " bytes. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value " + TOTAL_MEMORY + ", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ");
}

function emscripten_realloc_buffer(size) {
 var PAGE_MULTIPLE = 65536;
 size = alignUp(size, PAGE_MULTIPLE);
 var old = Module["buffer"];
 var oldSize = old.byteLength;
 try {
  var result = wasmMemory.grow((size - oldSize) / 65536);
  if (result !== (-1 | 0)) {
   return Module["buffer"] = wasmMemory.buffer;
  } else {
   return null;
  }
 } catch (e) {
  return null;
 }
}

function _emscripten_resize_heap(requestedSize) {
 var oldSize = _emscripten_get_heap_size();
 var PAGE_MULTIPLE = 65536;
 var LIMIT = 2147483648 - PAGE_MULTIPLE;
 if (requestedSize > LIMIT) {
  return false;
 }
 var MIN_TOTAL_MEMORY = 16777216;
 var newSize = Math.max(oldSize, MIN_TOTAL_MEMORY);
 while (newSize < requestedSize) {
  if (newSize <= 536870912) {
   newSize = alignUp(2 * newSize, PAGE_MULTIPLE);
  } else {
   newSize = Math.min(alignUp((3 * newSize + 2147483648) / 4, PAGE_MULTIPLE), LIMIT);
  }
 }
 var replacement = emscripten_realloc_buffer(newSize);
 if (!replacement || replacement.byteLength != newSize) {
  return false;
 }
 updateGlobalBuffer(replacement);
 updateGlobalBufferViews();
 TOTAL_MEMORY = newSize;
 HEAPU32[DYNAMICTOP_PTR >> 2] = requestedSize;
 return true;
}

function _gettimeofday(ptr) {
 var now = Date.now();
 HEAP32[ptr >> 2] = now / 1e3 | 0;
 HEAP32[ptr + 4 >> 2] = now % 1e3 * 1e3 | 0;
 return 0;
}

var _llvm_cos_f32 = Math_cos;

var _llvm_sin_f32 = Math_sin;

function _llvm_trap() {
 abort("trap!");
}

function _emscripten_memcpy_big(dest, src, num) {
 HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
}

var PTHREAD_SPECIFIC = {};

function _pthread_getspecific(key) {
 return PTHREAD_SPECIFIC[key] || 0;
}

var PTHREAD_SPECIFIC_NEXT_KEY = 1;

var ERRNO_CODES = {
 EPERM: 1,
 ENOENT: 2,
 ESRCH: 3,
 EINTR: 4,
 EIO: 5,
 ENXIO: 6,
 E2BIG: 7,
 ENOEXEC: 8,
 EBADF: 9,
 ECHILD: 10,
 EAGAIN: 11,
 EWOULDBLOCK: 11,
 ENOMEM: 12,
 EACCES: 13,
 EFAULT: 14,
 ENOTBLK: 15,
 EBUSY: 16,
 EEXIST: 17,
 EXDEV: 18,
 ENODEV: 19,
 ENOTDIR: 20,
 EISDIR: 21,
 EINVAL: 22,
 ENFILE: 23,
 EMFILE: 24,
 ENOTTY: 25,
 ETXTBSY: 26,
 EFBIG: 27,
 ENOSPC: 28,
 ESPIPE: 29,
 EROFS: 30,
 EMLINK: 31,
 EPIPE: 32,
 EDOM: 33,
 ERANGE: 34,
 ENOMSG: 42,
 EIDRM: 43,
 ECHRNG: 44,
 EL2NSYNC: 45,
 EL3HLT: 46,
 EL3RST: 47,
 ELNRNG: 48,
 EUNATCH: 49,
 ENOCSI: 50,
 EL2HLT: 51,
 EDEADLK: 35,
 ENOLCK: 37,
 EBADE: 52,
 EBADR: 53,
 EXFULL: 54,
 ENOANO: 55,
 EBADRQC: 56,
 EBADSLT: 57,
 EDEADLOCK: 35,
 EBFONT: 59,
 ENOSTR: 60,
 ENODATA: 61,
 ETIME: 62,
 ENOSR: 63,
 ENONET: 64,
 ENOPKG: 65,
 EREMOTE: 66,
 ENOLINK: 67,
 EADV: 68,
 ESRMNT: 69,
 ECOMM: 70,
 EPROTO: 71,
 EMULTIHOP: 72,
 EDOTDOT: 73,
 EBADMSG: 74,
 ENOTUNIQ: 76,
 EBADFD: 77,
 EREMCHG: 78,
 ELIBACC: 79,
 ELIBBAD: 80,
 ELIBSCN: 81,
 ELIBMAX: 82,
 ELIBEXEC: 83,
 ENOSYS: 38,
 ENOTEMPTY: 39,
 ENAMETOOLONG: 36,
 ELOOP: 40,
 EOPNOTSUPP: 95,
 EPFNOSUPPORT: 96,
 ECONNRESET: 104,
 ENOBUFS: 105,
 EAFNOSUPPORT: 97,
 EPROTOTYPE: 91,
 ENOTSOCK: 88,
 ENOPROTOOPT: 92,
 ESHUTDOWN: 108,
 ECONNREFUSED: 111,
 EADDRINUSE: 98,
 ECONNABORTED: 103,
 ENETUNREACH: 101,
 ENETDOWN: 100,
 ETIMEDOUT: 110,
 EHOSTDOWN: 112,
 EHOSTUNREACH: 113,
 EINPROGRESS: 115,
 EALREADY: 114,
 EDESTADDRREQ: 89,
 EMSGSIZE: 90,
 EPROTONOSUPPORT: 93,
 ESOCKTNOSUPPORT: 94,
 EADDRNOTAVAIL: 99,
 ENETRESET: 102,
 EISCONN: 106,
 ENOTCONN: 107,
 ETOOMANYREFS: 109,
 EUSERS: 87,
 EDQUOT: 122,
 ESTALE: 116,
 ENOTSUP: 95,
 ENOMEDIUM: 123,
 EILSEQ: 84,
 EOVERFLOW: 75,
 ECANCELED: 125,
 ENOTRECOVERABLE: 131,
 EOWNERDEAD: 130,
 ESTRPIPE: 86
};

function _pthread_key_create(key, destructor) {
 if (key == 0) {
  return ERRNO_CODES.EINVAL;
 }
 HEAP32[key >> 2] = PTHREAD_SPECIFIC_NEXT_KEY;
 PTHREAD_SPECIFIC[PTHREAD_SPECIFIC_NEXT_KEY] = 0;
 PTHREAD_SPECIFIC_NEXT_KEY++;
 return 0;
}

function _pthread_once(ptr, func) {
 if (!_pthread_once.seen) _pthread_once.seen = {};
 if (ptr in _pthread_once.seen) return;
 dynCall_v(func);
 _pthread_once.seen[ptr] = 1;
}

function _pthread_setspecific(key, value) {
 if (!(key in PTHREAD_SPECIFIC)) {
  return ERRNO_CODES.EINVAL;
 }
 PTHREAD_SPECIFIC[key] = value;
 return 0;
}

function ___setErrNo(value) {
 if (Module["___errno_location"]) HEAP32[Module["___errno_location"]() >> 2] = value;
 return value;
}

function intArrayFromString(stringy, dontAddNull, length) {
 var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
 var u8array = new Array(len);
 var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
 if (dontAddNull) u8array.length = numBytesWritten;
 return u8array;
}

var asmGlobalArg = {};

var asmLibraryArg = {
 "b": abort,
 "z": ___cxa_pure_virtual,
 "g": ___setErrNo,
 "y": ___syscall140,
 "f": ___syscall146,
 "x": ___syscall6,
 "w": _abort,
 "v": _emscripten_asm_const_diiiiiiii,
 "u": _emscripten_asm_const_ii,
 "e": _emscripten_asm_const_iii,
 "t": _emscripten_asm_const_iiii,
 "s": _emscripten_asm_const_iiiidii,
 "r": _emscripten_asm_const_iiiii,
 "q": _emscripten_get_heap_size,
 "p": _emscripten_memcpy_big,
 "o": _emscripten_resize_heap,
 "c": _gettimeofday,
 "n": _llvm_cos_f32,
 "m": _llvm_sin_f32,
 "d": _llvm_trap,
 "l": _pthread_getspecific,
 "k": _pthread_key_create,
 "j": _pthread_once,
 "i": _pthread_setspecific,
 "h": abortOnCannotGrowMemory,
 "a": DYNAMICTOP_PTR
};

var asm = Module["asm"](asmGlobalArg, asmLibraryArg, buffer);

Module["asm"] = asm;

var __GLOBAL__sub_I_btQuickprof_cpp = Module["__GLOBAL__sub_I_btQuickprof_cpp"] = function() {
 return Module["asm"]["A"].apply(null, arguments);
};

var _emscripten_bind_ClosestConvexResultCallback_ClosestConvexResultCallback_2 = Module["_emscripten_bind_ClosestConvexResultCallback_ClosestConvexResultCallback_2"] = function() {
 return Module["asm"]["B"].apply(null, arguments);
};

var _emscripten_bind_ClosestConvexResultCallback___destroy___0 = Module["_emscripten_bind_ClosestConvexResultCallback___destroy___0"] = function() {
 return Module["asm"]["C"].apply(null, arguments);
};

var _emscripten_bind_ClosestConvexResultCallback_get_m_closestHitFraction_0 = Module["_emscripten_bind_ClosestConvexResultCallback_get_m_closestHitFraction_0"] = function() {
 return Module["asm"]["D"].apply(null, arguments);
};

var _emscripten_bind_ClosestConvexResultCallback_get_m_collisionFilterGroup_0 = Module["_emscripten_bind_ClosestConvexResultCallback_get_m_collisionFilterGroup_0"] = function() {
 return Module["asm"]["E"].apply(null, arguments);
};

var _emscripten_bind_ClosestConvexResultCallback_get_m_collisionFilterMask_0 = Module["_emscripten_bind_ClosestConvexResultCallback_get_m_collisionFilterMask_0"] = function() {
 return Module["asm"]["F"].apply(null, arguments);
};

var _emscripten_bind_ClosestConvexResultCallback_get_m_convexFromWorld_0 = Module["_emscripten_bind_ClosestConvexResultCallback_get_m_convexFromWorld_0"] = function() {
 return Module["asm"]["G"].apply(null, arguments);
};

var _emscripten_bind_ClosestConvexResultCallback_get_m_convexToWorld_0 = Module["_emscripten_bind_ClosestConvexResultCallback_get_m_convexToWorld_0"] = function() {
 return Module["asm"]["H"].apply(null, arguments);
};

var _emscripten_bind_ClosestConvexResultCallback_get_m_hitNormalWorld_0 = Module["_emscripten_bind_ClosestConvexResultCallback_get_m_hitNormalWorld_0"] = function() {
 return Module["asm"]["I"].apply(null, arguments);
};

var _emscripten_bind_ClosestConvexResultCallback_get_m_hitPointWorld_0 = Module["_emscripten_bind_ClosestConvexResultCallback_get_m_hitPointWorld_0"] = function() {
 return Module["asm"]["J"].apply(null, arguments);
};

var _emscripten_bind_ClosestConvexResultCallback_hasHit_0 = Module["_emscripten_bind_ClosestConvexResultCallback_hasHit_0"] = function() {
 return Module["asm"]["K"].apply(null, arguments);
};

var _emscripten_bind_ClosestConvexResultCallback_set_m_closestHitFraction_1 = Module["_emscripten_bind_ClosestConvexResultCallback_set_m_closestHitFraction_1"] = function() {
 return Module["asm"]["L"].apply(null, arguments);
};

var _emscripten_bind_ClosestConvexResultCallback_set_m_collisionFilterGroup_1 = Module["_emscripten_bind_ClosestConvexResultCallback_set_m_collisionFilterGroup_1"] = function() {
 return Module["asm"]["M"].apply(null, arguments);
};

var _emscripten_bind_ClosestConvexResultCallback_set_m_collisionFilterMask_1 = Module["_emscripten_bind_ClosestConvexResultCallback_set_m_collisionFilterMask_1"] = function() {
 return Module["asm"]["N"].apply(null, arguments);
};

var _emscripten_bind_ClosestConvexResultCallback_set_m_convexFromWorld_1 = Module["_emscripten_bind_ClosestConvexResultCallback_set_m_convexFromWorld_1"] = function() {
 return Module["asm"]["O"].apply(null, arguments);
};

var _emscripten_bind_ClosestConvexResultCallback_set_m_convexToWorld_1 = Module["_emscripten_bind_ClosestConvexResultCallback_set_m_convexToWorld_1"] = function() {
 return Module["asm"]["P"].apply(null, arguments);
};

var _emscripten_bind_ClosestConvexResultCallback_set_m_hitNormalWorld_1 = Module["_emscripten_bind_ClosestConvexResultCallback_set_m_hitNormalWorld_1"] = function() {
 return Module["asm"]["Q"].apply(null, arguments);
};

var _emscripten_bind_ClosestConvexResultCallback_set_m_hitPointWorld_1 = Module["_emscripten_bind_ClosestConvexResultCallback_set_m_hitPointWorld_1"] = function() {
 return Module["asm"]["R"].apply(null, arguments);
};

var _emscripten_bind_ClosestRayResultCallback_ClosestRayResultCallback_2 = Module["_emscripten_bind_ClosestRayResultCallback_ClosestRayResultCallback_2"] = function() {
 return Module["asm"]["S"].apply(null, arguments);
};

var _emscripten_bind_ClosestRayResultCallback___destroy___0 = Module["_emscripten_bind_ClosestRayResultCallback___destroy___0"] = function() {
 return Module["asm"]["T"].apply(null, arguments);
};

var _emscripten_bind_ClosestRayResultCallback_get_m_closestHitFraction_0 = Module["_emscripten_bind_ClosestRayResultCallback_get_m_closestHitFraction_0"] = function() {
 return Module["asm"]["U"].apply(null, arguments);
};

var _emscripten_bind_ClosestRayResultCallback_get_m_collisionFilterGroup_0 = Module["_emscripten_bind_ClosestRayResultCallback_get_m_collisionFilterGroup_0"] = function() {
 return Module["asm"]["V"].apply(null, arguments);
};

var _emscripten_bind_ClosestRayResultCallback_get_m_collisionFilterMask_0 = Module["_emscripten_bind_ClosestRayResultCallback_get_m_collisionFilterMask_0"] = function() {
 return Module["asm"]["W"].apply(null, arguments);
};

var _emscripten_bind_ClosestRayResultCallback_get_m_collisionObject_0 = Module["_emscripten_bind_ClosestRayResultCallback_get_m_collisionObject_0"] = function() {
 return Module["asm"]["X"].apply(null, arguments);
};

var _emscripten_bind_ClosestRayResultCallback_get_m_hitNormalWorld_0 = Module["_emscripten_bind_ClosestRayResultCallback_get_m_hitNormalWorld_0"] = function() {
 return Module["asm"]["Y"].apply(null, arguments);
};

var _emscripten_bind_ClosestRayResultCallback_get_m_hitPointWorld_0 = Module["_emscripten_bind_ClosestRayResultCallback_get_m_hitPointWorld_0"] = function() {
 return Module["asm"]["Z"].apply(null, arguments);
};

var _emscripten_bind_ClosestRayResultCallback_get_m_rayFromWorld_0 = Module["_emscripten_bind_ClosestRayResultCallback_get_m_rayFromWorld_0"] = function() {
 return Module["asm"]["_"].apply(null, arguments);
};

var _emscripten_bind_ClosestRayResultCallback_get_m_rayToWorld_0 = Module["_emscripten_bind_ClosestRayResultCallback_get_m_rayToWorld_0"] = function() {
 return Module["asm"]["$"].apply(null, arguments);
};

var _emscripten_bind_ClosestRayResultCallback_hasHit_0 = Module["_emscripten_bind_ClosestRayResultCallback_hasHit_0"] = function() {
 return Module["asm"]["aa"].apply(null, arguments);
};

var _emscripten_bind_ClosestRayResultCallback_set_m_closestHitFraction_1 = Module["_emscripten_bind_ClosestRayResultCallback_set_m_closestHitFraction_1"] = function() {
 return Module["asm"]["ba"].apply(null, arguments);
};

var _emscripten_bind_ClosestRayResultCallback_set_m_collisionFilterGroup_1 = Module["_emscripten_bind_ClosestRayResultCallback_set_m_collisionFilterGroup_1"] = function() {
 return Module["asm"]["ca"].apply(null, arguments);
};

var _emscripten_bind_ClosestRayResultCallback_set_m_collisionFilterMask_1 = Module["_emscripten_bind_ClosestRayResultCallback_set_m_collisionFilterMask_1"] = function() {
 return Module["asm"]["da"].apply(null, arguments);
};

var _emscripten_bind_ClosestRayResultCallback_set_m_collisionObject_1 = Module["_emscripten_bind_ClosestRayResultCallback_set_m_collisionObject_1"] = function() {
 return Module["asm"]["ea"].apply(null, arguments);
};

var _emscripten_bind_ClosestRayResultCallback_set_m_hitNormalWorld_1 = Module["_emscripten_bind_ClosestRayResultCallback_set_m_hitNormalWorld_1"] = function() {
 return Module["asm"]["fa"].apply(null, arguments);
};

var _emscripten_bind_ClosestRayResultCallback_set_m_hitPointWorld_1 = Module["_emscripten_bind_ClosestRayResultCallback_set_m_hitPointWorld_1"] = function() {
 return Module["asm"]["ga"].apply(null, arguments);
};

var _emscripten_bind_ClosestRayResultCallback_set_m_rayFromWorld_1 = Module["_emscripten_bind_ClosestRayResultCallback_set_m_rayFromWorld_1"] = function() {
 return Module["asm"]["ha"].apply(null, arguments);
};

var _emscripten_bind_ClosestRayResultCallback_set_m_rayToWorld_1 = Module["_emscripten_bind_ClosestRayResultCallback_set_m_rayToWorld_1"] = function() {
 return Module["asm"]["ia"].apply(null, arguments);
};

var _emscripten_bind_ConcreteContactResultCallback_ConcreteContactResultCallback_0 = Module["_emscripten_bind_ConcreteContactResultCallback_ConcreteContactResultCallback_0"] = function() {
 return Module["asm"]["ja"].apply(null, arguments);
};

var _emscripten_bind_ConcreteContactResultCallback___destroy___0 = Module["_emscripten_bind_ConcreteContactResultCallback___destroy___0"] = function() {
 return Module["asm"]["ka"].apply(null, arguments);
};

var _emscripten_bind_ConcreteContactResultCallback_addSingleResult_7 = Module["_emscripten_bind_ConcreteContactResultCallback_addSingleResult_7"] = function() {
 return Module["asm"]["la"].apply(null, arguments);
};

var _emscripten_bind_ContactResultCallback___destroy___0 = Module["_emscripten_bind_ContactResultCallback___destroy___0"] = function() {
 return Module["asm"]["ma"].apply(null, arguments);
};

var _emscripten_bind_ContactResultCallback_addSingleResult_7 = Module["_emscripten_bind_ContactResultCallback_addSingleResult_7"] = function() {
 return Module["asm"]["na"].apply(null, arguments);
};

var _emscripten_bind_ConvexResultCallback___destroy___0 = Module["_emscripten_bind_ConvexResultCallback___destroy___0"] = function() {
 return Module["asm"]["oa"].apply(null, arguments);
};

var _emscripten_bind_ConvexResultCallback_get_m_closestHitFraction_0 = Module["_emscripten_bind_ConvexResultCallback_get_m_closestHitFraction_0"] = function() {
 return Module["asm"]["pa"].apply(null, arguments);
};

var _emscripten_bind_ConvexResultCallback_get_m_collisionFilterGroup_0 = Module["_emscripten_bind_ConvexResultCallback_get_m_collisionFilterGroup_0"] = function() {
 return Module["asm"]["qa"].apply(null, arguments);
};

var _emscripten_bind_ConvexResultCallback_get_m_collisionFilterMask_0 = Module["_emscripten_bind_ConvexResultCallback_get_m_collisionFilterMask_0"] = function() {
 return Module["asm"]["ra"].apply(null, arguments);
};

var _emscripten_bind_ConvexResultCallback_hasHit_0 = Module["_emscripten_bind_ConvexResultCallback_hasHit_0"] = function() {
 return Module["asm"]["sa"].apply(null, arguments);
};

var _emscripten_bind_ConvexResultCallback_set_m_closestHitFraction_1 = Module["_emscripten_bind_ConvexResultCallback_set_m_closestHitFraction_1"] = function() {
 return Module["asm"]["ta"].apply(null, arguments);
};

var _emscripten_bind_ConvexResultCallback_set_m_collisionFilterGroup_1 = Module["_emscripten_bind_ConvexResultCallback_set_m_collisionFilterGroup_1"] = function() {
 return Module["asm"]["ua"].apply(null, arguments);
};

var _emscripten_bind_ConvexResultCallback_set_m_collisionFilterMask_1 = Module["_emscripten_bind_ConvexResultCallback_set_m_collisionFilterMask_1"] = function() {
 return Module["asm"]["va"].apply(null, arguments);
};

var _emscripten_bind_DebugDrawer_DebugDrawer_0 = Module["_emscripten_bind_DebugDrawer_DebugDrawer_0"] = function() {
 return Module["asm"]["wa"].apply(null, arguments);
};

var _emscripten_bind_DebugDrawer___destroy___0 = Module["_emscripten_bind_DebugDrawer___destroy___0"] = function() {
 return Module["asm"]["xa"].apply(null, arguments);
};

var _emscripten_bind_DebugDrawer_draw3dText_2 = Module["_emscripten_bind_DebugDrawer_draw3dText_2"] = function() {
 return Module["asm"]["ya"].apply(null, arguments);
};

var _emscripten_bind_DebugDrawer_drawContactPoint_5 = Module["_emscripten_bind_DebugDrawer_drawContactPoint_5"] = function() {
 return Module["asm"]["za"].apply(null, arguments);
};

var _emscripten_bind_DebugDrawer_drawLine_3 = Module["_emscripten_bind_DebugDrawer_drawLine_3"] = function() {
 return Module["asm"]["Aa"].apply(null, arguments);
};

var _emscripten_bind_DebugDrawer_getDebugMode_0 = Module["_emscripten_bind_DebugDrawer_getDebugMode_0"] = function() {
 return Module["asm"]["Ba"].apply(null, arguments);
};

var _emscripten_bind_DebugDrawer_reportErrorWarning_1 = Module["_emscripten_bind_DebugDrawer_reportErrorWarning_1"] = function() {
 return Module["asm"]["Ca"].apply(null, arguments);
};

var _emscripten_bind_DebugDrawer_setDebugMode_1 = Module["_emscripten_bind_DebugDrawer_setDebugMode_1"] = function() {
 return Module["asm"]["Da"].apply(null, arguments);
};

var _emscripten_bind_LocalConvexResult_LocalConvexResult_5 = Module["_emscripten_bind_LocalConvexResult_LocalConvexResult_5"] = function() {
 return Module["asm"]["Ea"].apply(null, arguments);
};

var _emscripten_bind_LocalConvexResult___destroy___0 = Module["_emscripten_bind_LocalConvexResult___destroy___0"] = function() {
 return Module["asm"]["Fa"].apply(null, arguments);
};

var _emscripten_bind_LocalConvexResult_get_m_hitCollisionObject_0 = Module["_emscripten_bind_LocalConvexResult_get_m_hitCollisionObject_0"] = function() {
 return Module["asm"]["Ga"].apply(null, arguments);
};

var _emscripten_bind_LocalConvexResult_get_m_hitFraction_0 = Module["_emscripten_bind_LocalConvexResult_get_m_hitFraction_0"] = function() {
 return Module["asm"]["Ha"].apply(null, arguments);
};

var _emscripten_bind_LocalConvexResult_get_m_hitNormalLocal_0 = Module["_emscripten_bind_LocalConvexResult_get_m_hitNormalLocal_0"] = function() {
 return Module["asm"]["Ia"].apply(null, arguments);
};

var _emscripten_bind_LocalConvexResult_get_m_hitPointLocal_0 = Module["_emscripten_bind_LocalConvexResult_get_m_hitPointLocal_0"] = function() {
 return Module["asm"]["Ja"].apply(null, arguments);
};

var _emscripten_bind_LocalConvexResult_get_m_localShapeInfo_0 = Module["_emscripten_bind_LocalConvexResult_get_m_localShapeInfo_0"] = function() {
 return Module["asm"]["Ka"].apply(null, arguments);
};

var _emscripten_bind_LocalConvexResult_set_m_hitCollisionObject_1 = Module["_emscripten_bind_LocalConvexResult_set_m_hitCollisionObject_1"] = function() {
 return Module["asm"]["La"].apply(null, arguments);
};

var _emscripten_bind_LocalConvexResult_set_m_hitFraction_1 = Module["_emscripten_bind_LocalConvexResult_set_m_hitFraction_1"] = function() {
 return Module["asm"]["Ma"].apply(null, arguments);
};

var _emscripten_bind_LocalConvexResult_set_m_hitNormalLocal_1 = Module["_emscripten_bind_LocalConvexResult_set_m_hitNormalLocal_1"] = function() {
 return Module["asm"]["Na"].apply(null, arguments);
};

var _emscripten_bind_LocalConvexResult_set_m_hitPointLocal_1 = Module["_emscripten_bind_LocalConvexResult_set_m_hitPointLocal_1"] = function() {
 return Module["asm"]["Oa"].apply(null, arguments);
};

var _emscripten_bind_LocalConvexResult_set_m_localShapeInfo_1 = Module["_emscripten_bind_LocalConvexResult_set_m_localShapeInfo_1"] = function() {
 return Module["asm"]["Pa"].apply(null, arguments);
};

var _emscripten_bind_LocalShapeInfo___destroy___0 = Module["_emscripten_bind_LocalShapeInfo___destroy___0"] = function() {
 return Module["asm"]["Qa"].apply(null, arguments);
};

var _emscripten_bind_LocalShapeInfo_get_m_shapePart_0 = Module["_emscripten_bind_LocalShapeInfo_get_m_shapePart_0"] = function() {
 return Module["asm"]["Ra"].apply(null, arguments);
};

var _emscripten_bind_LocalShapeInfo_get_m_triangleIndex_0 = Module["_emscripten_bind_LocalShapeInfo_get_m_triangleIndex_0"] = function() {
 return Module["asm"]["Sa"].apply(null, arguments);
};

var _emscripten_bind_LocalShapeInfo_set_m_shapePart_1 = Module["_emscripten_bind_LocalShapeInfo_set_m_shapePart_1"] = function() {
 return Module["asm"]["Ta"].apply(null, arguments);
};

var _emscripten_bind_LocalShapeInfo_set_m_triangleIndex_1 = Module["_emscripten_bind_LocalShapeInfo_set_m_triangleIndex_1"] = function() {
 return Module["asm"]["Ua"].apply(null, arguments);
};

var _emscripten_bind_RayResultCallback___destroy___0 = Module["_emscripten_bind_RayResultCallback___destroy___0"] = function() {
 return Module["asm"]["Va"].apply(null, arguments);
};

var _emscripten_bind_RayResultCallback_get_m_closestHitFraction_0 = Module["_emscripten_bind_RayResultCallback_get_m_closestHitFraction_0"] = function() {
 return Module["asm"]["Wa"].apply(null, arguments);
};

var _emscripten_bind_RayResultCallback_get_m_collisionFilterGroup_0 = Module["_emscripten_bind_RayResultCallback_get_m_collisionFilterGroup_0"] = function() {
 return Module["asm"]["Xa"].apply(null, arguments);
};

var _emscripten_bind_RayResultCallback_get_m_collisionFilterMask_0 = Module["_emscripten_bind_RayResultCallback_get_m_collisionFilterMask_0"] = function() {
 return Module["asm"]["Ya"].apply(null, arguments);
};

var _emscripten_bind_RayResultCallback_get_m_collisionObject_0 = Module["_emscripten_bind_RayResultCallback_get_m_collisionObject_0"] = function() {
 return Module["asm"]["Za"].apply(null, arguments);
};

var _emscripten_bind_RayResultCallback_hasHit_0 = Module["_emscripten_bind_RayResultCallback_hasHit_0"] = function() {
 return Module["asm"]["_a"].apply(null, arguments);
};

var _emscripten_bind_RayResultCallback_set_m_closestHitFraction_1 = Module["_emscripten_bind_RayResultCallback_set_m_closestHitFraction_1"] = function() {
 return Module["asm"]["$a"].apply(null, arguments);
};

var _emscripten_bind_RayResultCallback_set_m_collisionFilterGroup_1 = Module["_emscripten_bind_RayResultCallback_set_m_collisionFilterGroup_1"] = function() {
 return Module["asm"]["ab"].apply(null, arguments);
};

var _emscripten_bind_RayResultCallback_set_m_collisionFilterMask_1 = Module["_emscripten_bind_RayResultCallback_set_m_collisionFilterMask_1"] = function() {
 return Module["asm"]["bb"].apply(null, arguments);
};

var _emscripten_bind_RayResultCallback_set_m_collisionObject_1 = Module["_emscripten_bind_RayResultCallback_set_m_collisionObject_1"] = function() {
 return Module["asm"]["cb"].apply(null, arguments);
};

var _emscripten_bind_VoidPtr___destroy___0 = Module["_emscripten_bind_VoidPtr___destroy___0"] = function() {
 return Module["asm"]["db"].apply(null, arguments);
};

var _emscripten_bind_btActionInterface___destroy___0 = Module["_emscripten_bind_btActionInterface___destroy___0"] = function() {
 return Module["asm"]["eb"].apply(null, arguments);
};

var _emscripten_bind_btActionInterface_updateAction_2 = Module["_emscripten_bind_btActionInterface_updateAction_2"] = function() {
 return Module["asm"]["fb"].apply(null, arguments);
};

var _emscripten_bind_btAxisSweep3___destroy___0 = Module["_emscripten_bind_btAxisSweep3___destroy___0"] = function() {
 return Module["asm"]["gb"].apply(null, arguments);
};

var _emscripten_bind_btAxisSweep3_btAxisSweep3_2 = Module["_emscripten_bind_btAxisSweep3_btAxisSweep3_2"] = function() {
 return Module["asm"]["hb"].apply(null, arguments);
};

var _emscripten_bind_btAxisSweep3_btAxisSweep3_3 = Module["_emscripten_bind_btAxisSweep3_btAxisSweep3_3"] = function() {
 return Module["asm"]["ib"].apply(null, arguments);
};

var _emscripten_bind_btAxisSweep3_btAxisSweep3_4 = Module["_emscripten_bind_btAxisSweep3_btAxisSweep3_4"] = function() {
 return Module["asm"]["jb"].apply(null, arguments);
};

var _emscripten_bind_btAxisSweep3_btAxisSweep3_5 = Module["_emscripten_bind_btAxisSweep3_btAxisSweep3_5"] = function() {
 return Module["asm"]["kb"].apply(null, arguments);
};

var _emscripten_bind_btBoxShape___destroy___0 = Module["_emscripten_bind_btBoxShape___destroy___0"] = function() {
 return Module["asm"]["lb"].apply(null, arguments);
};

var _emscripten_bind_btBoxShape_btBoxShape_1 = Module["_emscripten_bind_btBoxShape_btBoxShape_1"] = function() {
 return Module["asm"]["mb"].apply(null, arguments);
};

var _emscripten_bind_btBoxShape_calculateLocalInertia_2 = Module["_emscripten_bind_btBoxShape_calculateLocalInertia_2"] = function() {
 return Module["asm"]["nb"].apply(null, arguments);
};

var _emscripten_bind_btBoxShape_getLocalScaling_0 = Module["_emscripten_bind_btBoxShape_getLocalScaling_0"] = function() {
 return Module["asm"]["ob"].apply(null, arguments);
};

var _emscripten_bind_btBoxShape_getMargin_0 = Module["_emscripten_bind_btBoxShape_getMargin_0"] = function() {
 return Module["asm"]["pb"].apply(null, arguments);
};

var _emscripten_bind_btBoxShape_setLocalScaling_1 = Module["_emscripten_bind_btBoxShape_setLocalScaling_1"] = function() {
 return Module["asm"]["qb"].apply(null, arguments);
};

var _emscripten_bind_btBoxShape_setMargin_1 = Module["_emscripten_bind_btBoxShape_setMargin_1"] = function() {
 return Module["asm"]["rb"].apply(null, arguments);
};

var _emscripten_bind_btBroadphaseInterface___destroy___0 = Module["_emscripten_bind_btBroadphaseInterface___destroy___0"] = function() {
 return Module["asm"]["sb"].apply(null, arguments);
};

var _emscripten_bind_btBroadphaseProxy___destroy___0 = Module["_emscripten_bind_btBroadphaseProxy___destroy___0"] = function() {
 return Module["asm"]["tb"].apply(null, arguments);
};

var _emscripten_bind_btBroadphaseProxy_get_m_collisionFilterGroup_0 = Module["_emscripten_bind_btBroadphaseProxy_get_m_collisionFilterGroup_0"] = function() {
 return Module["asm"]["ub"].apply(null, arguments);
};

var _emscripten_bind_btBroadphaseProxy_get_m_collisionFilterMask_0 = Module["_emscripten_bind_btBroadphaseProxy_get_m_collisionFilterMask_0"] = function() {
 return Module["asm"]["vb"].apply(null, arguments);
};

var _emscripten_bind_btBroadphaseProxy_set_m_collisionFilterGroup_1 = Module["_emscripten_bind_btBroadphaseProxy_set_m_collisionFilterGroup_1"] = function() {
 return Module["asm"]["wb"].apply(null, arguments);
};

var _emscripten_bind_btBroadphaseProxy_set_m_collisionFilterMask_1 = Module["_emscripten_bind_btBroadphaseProxy_set_m_collisionFilterMask_1"] = function() {
 return Module["asm"]["xb"].apply(null, arguments);
};

var _emscripten_bind_btBvhTriangleMeshShape___destroy___0 = Module["_emscripten_bind_btBvhTriangleMeshShape___destroy___0"] = function() {
 return Module["asm"]["yb"].apply(null, arguments);
};

var _emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_2 = Module["_emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_2"] = function() {
 return Module["asm"]["zb"].apply(null, arguments);
};

var _emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_3 = Module["_emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_3"] = function() {
 return Module["asm"]["Ab"].apply(null, arguments);
};

var _emscripten_bind_btBvhTriangleMeshShape_calculateLocalInertia_2 = Module["_emscripten_bind_btBvhTriangleMeshShape_calculateLocalInertia_2"] = function() {
 return Module["asm"]["Bb"].apply(null, arguments);
};

var _emscripten_bind_btBvhTriangleMeshShape_getLocalScaling_0 = Module["_emscripten_bind_btBvhTriangleMeshShape_getLocalScaling_0"] = function() {
 return Module["asm"]["Cb"].apply(null, arguments);
};

var _emscripten_bind_btBvhTriangleMeshShape_setLocalScaling_1 = Module["_emscripten_bind_btBvhTriangleMeshShape_setLocalScaling_1"] = function() {
 return Module["asm"]["Db"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShapeX___destroy___0 = Module["_emscripten_bind_btCapsuleShapeX___destroy___0"] = function() {
 return Module["asm"]["Eb"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShapeX_btCapsuleShapeX_2 = Module["_emscripten_bind_btCapsuleShapeX_btCapsuleShapeX_2"] = function() {
 return Module["asm"]["Fb"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShapeX_calculateLocalInertia_2 = Module["_emscripten_bind_btCapsuleShapeX_calculateLocalInertia_2"] = function() {
 return Module["asm"]["Gb"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShapeX_getHalfHeight_0 = Module["_emscripten_bind_btCapsuleShapeX_getHalfHeight_0"] = function() {
 return Module["asm"]["Hb"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShapeX_getLocalScaling_0 = Module["_emscripten_bind_btCapsuleShapeX_getLocalScaling_0"] = function() {
 return Module["asm"]["Ib"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShapeX_getMargin_0 = Module["_emscripten_bind_btCapsuleShapeX_getMargin_0"] = function() {
 return Module["asm"]["Jb"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShapeX_getRadius_0 = Module["_emscripten_bind_btCapsuleShapeX_getRadius_0"] = function() {
 return Module["asm"]["Kb"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShapeX_getUpAxis_0 = Module["_emscripten_bind_btCapsuleShapeX_getUpAxis_0"] = function() {
 return Module["asm"]["Lb"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShapeX_setLocalScaling_1 = Module["_emscripten_bind_btCapsuleShapeX_setLocalScaling_1"] = function() {
 return Module["asm"]["Mb"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShapeX_setMargin_1 = Module["_emscripten_bind_btCapsuleShapeX_setMargin_1"] = function() {
 return Module["asm"]["Nb"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShapeZ___destroy___0 = Module["_emscripten_bind_btCapsuleShapeZ___destroy___0"] = function() {
 return Module["asm"]["Ob"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShapeZ_btCapsuleShapeZ_2 = Module["_emscripten_bind_btCapsuleShapeZ_btCapsuleShapeZ_2"] = function() {
 return Module["asm"]["Pb"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShapeZ_calculateLocalInertia_2 = Module["_emscripten_bind_btCapsuleShapeZ_calculateLocalInertia_2"] = function() {
 return Module["asm"]["Qb"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShapeZ_getHalfHeight_0 = Module["_emscripten_bind_btCapsuleShapeZ_getHalfHeight_0"] = function() {
 return Module["asm"]["Rb"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShapeZ_getLocalScaling_0 = Module["_emscripten_bind_btCapsuleShapeZ_getLocalScaling_0"] = function() {
 return Module["asm"]["Sb"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShapeZ_getMargin_0 = Module["_emscripten_bind_btCapsuleShapeZ_getMargin_0"] = function() {
 return Module["asm"]["Tb"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShapeZ_getRadius_0 = Module["_emscripten_bind_btCapsuleShapeZ_getRadius_0"] = function() {
 return Module["asm"]["Ub"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShapeZ_getUpAxis_0 = Module["_emscripten_bind_btCapsuleShapeZ_getUpAxis_0"] = function() {
 return Module["asm"]["Vb"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShapeZ_setLocalScaling_1 = Module["_emscripten_bind_btCapsuleShapeZ_setLocalScaling_1"] = function() {
 return Module["asm"]["Wb"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShapeZ_setMargin_1 = Module["_emscripten_bind_btCapsuleShapeZ_setMargin_1"] = function() {
 return Module["asm"]["Xb"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShape___destroy___0 = Module["_emscripten_bind_btCapsuleShape___destroy___0"] = function() {
 return Module["asm"]["Yb"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShape_btCapsuleShape_2 = Module["_emscripten_bind_btCapsuleShape_btCapsuleShape_2"] = function() {
 return Module["asm"]["Zb"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShape_calculateLocalInertia_2 = Module["_emscripten_bind_btCapsuleShape_calculateLocalInertia_2"] = function() {
 return Module["asm"]["_b"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShape_getHalfHeight_0 = Module["_emscripten_bind_btCapsuleShape_getHalfHeight_0"] = function() {
 return Module["asm"]["$b"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShape_getLocalScaling_0 = Module["_emscripten_bind_btCapsuleShape_getLocalScaling_0"] = function() {
 return Module["asm"]["ac"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShape_getMargin_0 = Module["_emscripten_bind_btCapsuleShape_getMargin_0"] = function() {
 return Module["asm"]["bc"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShape_getRadius_0 = Module["_emscripten_bind_btCapsuleShape_getRadius_0"] = function() {
 return Module["asm"]["cc"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShape_getUpAxis_0 = Module["_emscripten_bind_btCapsuleShape_getUpAxis_0"] = function() {
 return Module["asm"]["dc"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShape_setLocalScaling_1 = Module["_emscripten_bind_btCapsuleShape_setLocalScaling_1"] = function() {
 return Module["asm"]["ec"].apply(null, arguments);
};

var _emscripten_bind_btCapsuleShape_setMargin_1 = Module["_emscripten_bind_btCapsuleShape_setMargin_1"] = function() {
 return Module["asm"]["fc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionConfiguration___destroy___0 = Module["_emscripten_bind_btCollisionConfiguration___destroy___0"] = function() {
 return Module["asm"]["gc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionDispatcher___destroy___0 = Module["_emscripten_bind_btCollisionDispatcher___destroy___0"] = function() {
 return Module["asm"]["hc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionDispatcher_btCollisionDispatcher_1 = Module["_emscripten_bind_btCollisionDispatcher_btCollisionDispatcher_1"] = function() {
 return Module["asm"]["ic"].apply(null, arguments);
};

var _emscripten_bind_btCollisionDispatcher_getManifoldByIndexInternal_1 = Module["_emscripten_bind_btCollisionDispatcher_getManifoldByIndexInternal_1"] = function() {
 return Module["asm"]["jc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionDispatcher_getNumManifolds_0 = Module["_emscripten_bind_btCollisionDispatcher_getNumManifolds_0"] = function() {
 return Module["asm"]["kc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject___destroy___0 = Module["_emscripten_bind_btCollisionObject___destroy___0"] = function() {
 return Module["asm"]["lc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_activate_0 = Module["_emscripten_bind_btCollisionObject_activate_0"] = function() {
 return Module["asm"]["mc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_activate_1 = Module["_emscripten_bind_btCollisionObject_activate_1"] = function() {
 return Module["asm"]["nc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_forceActivationState_1 = Module["_emscripten_bind_btCollisionObject_forceActivationState_1"] = function() {
 return Module["asm"]["oc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_getCollisionFlags_0 = Module["_emscripten_bind_btCollisionObject_getCollisionFlags_0"] = function() {
 return Module["asm"]["pc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_getCollisionShape_0 = Module["_emscripten_bind_btCollisionObject_getCollisionShape_0"] = function() {
 return Module["asm"]["qc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_getUserIndex_0 = Module["_emscripten_bind_btCollisionObject_getUserIndex_0"] = function() {
 return Module["asm"]["rc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_getUserPointer_0 = Module["_emscripten_bind_btCollisionObject_getUserPointer_0"] = function() {
 return Module["asm"]["sc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_getWorldTransform_0 = Module["_emscripten_bind_btCollisionObject_getWorldTransform_0"] = function() {
 return Module["asm"]["tc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_isActive_0 = Module["_emscripten_bind_btCollisionObject_isActive_0"] = function() {
 return Module["asm"]["uc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_isKinematicObject_0 = Module["_emscripten_bind_btCollisionObject_isKinematicObject_0"] = function() {
 return Module["asm"]["vc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_isStaticObject_0 = Module["_emscripten_bind_btCollisionObject_isStaticObject_0"] = function() {
 return Module["asm"]["wc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_isStaticOrKinematicObject_0 = Module["_emscripten_bind_btCollisionObject_isStaticOrKinematicObject_0"] = function() {
 return Module["asm"]["xc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_setActivationState_1 = Module["_emscripten_bind_btCollisionObject_setActivationState_1"] = function() {
 return Module["asm"]["yc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_setAnisotropicFriction_2 = Module["_emscripten_bind_btCollisionObject_setAnisotropicFriction_2"] = function() {
 return Module["asm"]["zc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_setCcdMotionThreshold_1 = Module["_emscripten_bind_btCollisionObject_setCcdMotionThreshold_1"] = function() {
 return Module["asm"]["Ac"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_setCcdSweptSphereRadius_1 = Module["_emscripten_bind_btCollisionObject_setCcdSweptSphereRadius_1"] = function() {
 return Module["asm"]["Bc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_setCollisionFlags_1 = Module["_emscripten_bind_btCollisionObject_setCollisionFlags_1"] = function() {
 return Module["asm"]["Cc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_setCollisionShape_1 = Module["_emscripten_bind_btCollisionObject_setCollisionShape_1"] = function() {
 return Module["asm"]["Dc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_setContactProcessingThreshold_1 = Module["_emscripten_bind_btCollisionObject_setContactProcessingThreshold_1"] = function() {
 return Module["asm"]["Ec"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_setFriction_1 = Module["_emscripten_bind_btCollisionObject_setFriction_1"] = function() {
 return Module["asm"]["Fc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_setRestitution_1 = Module["_emscripten_bind_btCollisionObject_setRestitution_1"] = function() {
 return Module["asm"]["Gc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_setRollingFriction_1 = Module["_emscripten_bind_btCollisionObject_setRollingFriction_1"] = function() {
 return Module["asm"]["Hc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_setUserIndex_1 = Module["_emscripten_bind_btCollisionObject_setUserIndex_1"] = function() {
 return Module["asm"]["Ic"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_setUserPointer_1 = Module["_emscripten_bind_btCollisionObject_setUserPointer_1"] = function() {
 return Module["asm"]["Jc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionObject_setWorldTransform_1 = Module["_emscripten_bind_btCollisionObject_setWorldTransform_1"] = function() {
 return Module["asm"]["Kc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionShape___destroy___0 = Module["_emscripten_bind_btCollisionShape___destroy___0"] = function() {
 return Module["asm"]["Lc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionShape_calculateLocalInertia_2 = Module["_emscripten_bind_btCollisionShape_calculateLocalInertia_2"] = function() {
 return Module["asm"]["Mc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionShape_getLocalScaling_0 = Module["_emscripten_bind_btCollisionShape_getLocalScaling_0"] = function() {
 return Module["asm"]["Nc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionShape_getMargin_0 = Module["_emscripten_bind_btCollisionShape_getMargin_0"] = function() {
 return Module["asm"]["Oc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionShape_setLocalScaling_1 = Module["_emscripten_bind_btCollisionShape_setLocalScaling_1"] = function() {
 return Module["asm"]["Pc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionShape_setMargin_1 = Module["_emscripten_bind_btCollisionShape_setMargin_1"] = function() {
 return Module["asm"]["Qc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionWorld___destroy___0 = Module["_emscripten_bind_btCollisionWorld___destroy___0"] = function() {
 return Module["asm"]["Rc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionWorld_addCollisionObject_1 = Module["_emscripten_bind_btCollisionWorld_addCollisionObject_1"] = function() {
 return Module["asm"]["Sc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionWorld_addCollisionObject_2 = Module["_emscripten_bind_btCollisionWorld_addCollisionObject_2"] = function() {
 return Module["asm"]["Tc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionWorld_addCollisionObject_3 = Module["_emscripten_bind_btCollisionWorld_addCollisionObject_3"] = function() {
 return Module["asm"]["Uc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionWorld_contactPairTest_3 = Module["_emscripten_bind_btCollisionWorld_contactPairTest_3"] = function() {
 return Module["asm"]["Vc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionWorld_contactTest_2 = Module["_emscripten_bind_btCollisionWorld_contactTest_2"] = function() {
 return Module["asm"]["Wc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionWorld_convexSweepTest_5 = Module["_emscripten_bind_btCollisionWorld_convexSweepTest_5"] = function() {
 return Module["asm"]["Xc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionWorld_debugDrawObject_3 = Module["_emscripten_bind_btCollisionWorld_debugDrawObject_3"] = function() {
 return Module["asm"]["Yc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionWorld_debugDrawWorld_0 = Module["_emscripten_bind_btCollisionWorld_debugDrawWorld_0"] = function() {
 return Module["asm"]["Zc"].apply(null, arguments);
};

var _emscripten_bind_btCollisionWorld_getBroadphase_0 = Module["_emscripten_bind_btCollisionWorld_getBroadphase_0"] = function() {
 return Module["asm"]["_c"].apply(null, arguments);
};

var _emscripten_bind_btCollisionWorld_getDebugDrawer_0 = Module["_emscripten_bind_btCollisionWorld_getDebugDrawer_0"] = function() {
 return Module["asm"]["$c"].apply(null, arguments);
};

var _emscripten_bind_btCollisionWorld_getDispatchInfo_0 = Module["_emscripten_bind_btCollisionWorld_getDispatchInfo_0"] = function() {
 return Module["asm"]["ad"].apply(null, arguments);
};

var _emscripten_bind_btCollisionWorld_getDispatcher_0 = Module["_emscripten_bind_btCollisionWorld_getDispatcher_0"] = function() {
 return Module["asm"]["bd"].apply(null, arguments);
};

var _emscripten_bind_btCollisionWorld_getPairCache_0 = Module["_emscripten_bind_btCollisionWorld_getPairCache_0"] = function() {
 return Module["asm"]["cd"].apply(null, arguments);
};

var _emscripten_bind_btCollisionWorld_rayTest_3 = Module["_emscripten_bind_btCollisionWorld_rayTest_3"] = function() {
 return Module["asm"]["dd"].apply(null, arguments);
};

var _emscripten_bind_btCollisionWorld_removeCollisionObject_1 = Module["_emscripten_bind_btCollisionWorld_removeCollisionObject_1"] = function() {
 return Module["asm"]["ed"].apply(null, arguments);
};

var _emscripten_bind_btCollisionWorld_setDebugDrawer_1 = Module["_emscripten_bind_btCollisionWorld_setDebugDrawer_1"] = function() {
 return Module["asm"]["fd"].apply(null, arguments);
};

var _emscripten_bind_btCollisionWorld_setForceUpdateAllAabbs_1 = Module["_emscripten_bind_btCollisionWorld_setForceUpdateAllAabbs_1"] = function() {
 return Module["asm"]["gd"].apply(null, arguments);
};

var _emscripten_bind_btCollisionWorld_updateSingleAabb_1 = Module["_emscripten_bind_btCollisionWorld_updateSingleAabb_1"] = function() {
 return Module["asm"]["hd"].apply(null, arguments);
};

var _emscripten_bind_btCompoundShape___destroy___0 = Module["_emscripten_bind_btCompoundShape___destroy___0"] = function() {
 return Module["asm"]["id"].apply(null, arguments);
};

var _emscripten_bind_btCompoundShape_addChildShape_2 = Module["_emscripten_bind_btCompoundShape_addChildShape_2"] = function() {
 return Module["asm"]["jd"].apply(null, arguments);
};

var _emscripten_bind_btCompoundShape_btCompoundShape_0 = Module["_emscripten_bind_btCompoundShape_btCompoundShape_0"] = function() {
 return Module["asm"]["kd"].apply(null, arguments);
};

var _emscripten_bind_btCompoundShape_btCompoundShape_1 = Module["_emscripten_bind_btCompoundShape_btCompoundShape_1"] = function() {
 return Module["asm"]["ld"].apply(null, arguments);
};

var _emscripten_bind_btCompoundShape_calculateLocalInertia_2 = Module["_emscripten_bind_btCompoundShape_calculateLocalInertia_2"] = function() {
 return Module["asm"]["md"].apply(null, arguments);
};

var _emscripten_bind_btCompoundShape_getChildShape_1 = Module["_emscripten_bind_btCompoundShape_getChildShape_1"] = function() {
 return Module["asm"]["nd"].apply(null, arguments);
};

var _emscripten_bind_btCompoundShape_getLocalScaling_0 = Module["_emscripten_bind_btCompoundShape_getLocalScaling_0"] = function() {
 return Module["asm"]["od"].apply(null, arguments);
};

var _emscripten_bind_btCompoundShape_getMargin_0 = Module["_emscripten_bind_btCompoundShape_getMargin_0"] = function() {
 return Module["asm"]["pd"].apply(null, arguments);
};

var _emscripten_bind_btCompoundShape_getNumChildShapes_0 = Module["_emscripten_bind_btCompoundShape_getNumChildShapes_0"] = function() {
 return Module["asm"]["qd"].apply(null, arguments);
};

var _emscripten_bind_btCompoundShape_removeChildShapeByIndex_1 = Module["_emscripten_bind_btCompoundShape_removeChildShapeByIndex_1"] = function() {
 return Module["asm"]["rd"].apply(null, arguments);
};

var _emscripten_bind_btCompoundShape_removeChildShape_1 = Module["_emscripten_bind_btCompoundShape_removeChildShape_1"] = function() {
 return Module["asm"]["sd"].apply(null, arguments);
};

var _emscripten_bind_btCompoundShape_setLocalScaling_1 = Module["_emscripten_bind_btCompoundShape_setLocalScaling_1"] = function() {
 return Module["asm"]["td"].apply(null, arguments);
};

var _emscripten_bind_btCompoundShape_setMargin_1 = Module["_emscripten_bind_btCompoundShape_setMargin_1"] = function() {
 return Module["asm"]["ud"].apply(null, arguments);
};

var _emscripten_bind_btConcaveShape___destroy___0 = Module["_emscripten_bind_btConcaveShape___destroy___0"] = function() {
 return Module["asm"]["vd"].apply(null, arguments);
};

var _emscripten_bind_btConcaveShape_calculateLocalInertia_2 = Module["_emscripten_bind_btConcaveShape_calculateLocalInertia_2"] = function() {
 return Module["asm"]["wd"].apply(null, arguments);
};

var _emscripten_bind_btConcaveShape_getLocalScaling_0 = Module["_emscripten_bind_btConcaveShape_getLocalScaling_0"] = function() {
 return Module["asm"]["xd"].apply(null, arguments);
};

var _emscripten_bind_btConcaveShape_setLocalScaling_1 = Module["_emscripten_bind_btConcaveShape_setLocalScaling_1"] = function() {
 return Module["asm"]["yd"].apply(null, arguments);
};

var _emscripten_bind_btConeShapeX___destroy___0 = Module["_emscripten_bind_btConeShapeX___destroy___0"] = function() {
 return Module["asm"]["zd"].apply(null, arguments);
};

var _emscripten_bind_btConeShapeX_btConeShapeX_2 = Module["_emscripten_bind_btConeShapeX_btConeShapeX_2"] = function() {
 return Module["asm"]["Ad"].apply(null, arguments);
};

var _emscripten_bind_btConeShapeX_calculateLocalInertia_2 = Module["_emscripten_bind_btConeShapeX_calculateLocalInertia_2"] = function() {
 return Module["asm"]["Bd"].apply(null, arguments);
};

var _emscripten_bind_btConeShapeX_getLocalScaling_0 = Module["_emscripten_bind_btConeShapeX_getLocalScaling_0"] = function() {
 return Module["asm"]["Cd"].apply(null, arguments);
};

var _emscripten_bind_btConeShapeX_setLocalScaling_1 = Module["_emscripten_bind_btConeShapeX_setLocalScaling_1"] = function() {
 return Module["asm"]["Dd"].apply(null, arguments);
};

var _emscripten_bind_btConeShapeZ___destroy___0 = Module["_emscripten_bind_btConeShapeZ___destroy___0"] = function() {
 return Module["asm"]["Ed"].apply(null, arguments);
};

var _emscripten_bind_btConeShapeZ_btConeShapeZ_2 = Module["_emscripten_bind_btConeShapeZ_btConeShapeZ_2"] = function() {
 return Module["asm"]["Fd"].apply(null, arguments);
};

var _emscripten_bind_btConeShapeZ_calculateLocalInertia_2 = Module["_emscripten_bind_btConeShapeZ_calculateLocalInertia_2"] = function() {
 return Module["asm"]["Gd"].apply(null, arguments);
};

var _emscripten_bind_btConeShapeZ_getLocalScaling_0 = Module["_emscripten_bind_btConeShapeZ_getLocalScaling_0"] = function() {
 return Module["asm"]["Hd"].apply(null, arguments);
};

var _emscripten_bind_btConeShapeZ_setLocalScaling_1 = Module["_emscripten_bind_btConeShapeZ_setLocalScaling_1"] = function() {
 return Module["asm"]["Id"].apply(null, arguments);
};

var _emscripten_bind_btConeShape___destroy___0 = Module["_emscripten_bind_btConeShape___destroy___0"] = function() {
 return Module["asm"]["Jd"].apply(null, arguments);
};

var _emscripten_bind_btConeShape_btConeShape_2 = Module["_emscripten_bind_btConeShape_btConeShape_2"] = function() {
 return Module["asm"]["Kd"].apply(null, arguments);
};

var _emscripten_bind_btConeShape_calculateLocalInertia_2 = Module["_emscripten_bind_btConeShape_calculateLocalInertia_2"] = function() {
 return Module["asm"]["Ld"].apply(null, arguments);
};

var _emscripten_bind_btConeShape_getLocalScaling_0 = Module["_emscripten_bind_btConeShape_getLocalScaling_0"] = function() {
 return Module["asm"]["Md"].apply(null, arguments);
};

var _emscripten_bind_btConeShape_setLocalScaling_1 = Module["_emscripten_bind_btConeShape_setLocalScaling_1"] = function() {
 return Module["asm"]["Nd"].apply(null, arguments);
};

var _emscripten_bind_btConeTwistConstraint___destroy___0 = Module["_emscripten_bind_btConeTwistConstraint___destroy___0"] = function() {
 return Module["asm"]["Od"].apply(null, arguments);
};

var _emscripten_bind_btConeTwistConstraint_btConeTwistConstraint_2 = Module["_emscripten_bind_btConeTwistConstraint_btConeTwistConstraint_2"] = function() {
 return Module["asm"]["Pd"].apply(null, arguments);
};

var _emscripten_bind_btConeTwistConstraint_btConeTwistConstraint_4 = Module["_emscripten_bind_btConeTwistConstraint_btConeTwistConstraint_4"] = function() {
 return Module["asm"]["Qd"].apply(null, arguments);
};

var _emscripten_bind_btConeTwistConstraint_enableFeedback_1 = Module["_emscripten_bind_btConeTwistConstraint_enableFeedback_1"] = function() {
 return Module["asm"]["Rd"].apply(null, arguments);
};

var _emscripten_bind_btConeTwistConstraint_enableMotor_1 = Module["_emscripten_bind_btConeTwistConstraint_enableMotor_1"] = function() {
 return Module["asm"]["Sd"].apply(null, arguments);
};

var _emscripten_bind_btConeTwistConstraint_getBreakingImpulseThreshold_0 = Module["_emscripten_bind_btConeTwistConstraint_getBreakingImpulseThreshold_0"] = function() {
 return Module["asm"]["Td"].apply(null, arguments);
};

var _emscripten_bind_btConeTwistConstraint_getParam_2 = Module["_emscripten_bind_btConeTwistConstraint_getParam_2"] = function() {
 return Module["asm"]["Ud"].apply(null, arguments);
};

var _emscripten_bind_btConeTwistConstraint_setAngularOnly_1 = Module["_emscripten_bind_btConeTwistConstraint_setAngularOnly_1"] = function() {
 return Module["asm"]["Vd"].apply(null, arguments);
};

var _emscripten_bind_btConeTwistConstraint_setBreakingImpulseThreshold_1 = Module["_emscripten_bind_btConeTwistConstraint_setBreakingImpulseThreshold_1"] = function() {
 return Module["asm"]["Wd"].apply(null, arguments);
};

var _emscripten_bind_btConeTwistConstraint_setDamping_1 = Module["_emscripten_bind_btConeTwistConstraint_setDamping_1"] = function() {
 return Module["asm"]["Xd"].apply(null, arguments);
};

var _emscripten_bind_btConeTwistConstraint_setLimit_2 = Module["_emscripten_bind_btConeTwistConstraint_setLimit_2"] = function() {
 return Module["asm"]["Yd"].apply(null, arguments);
};

var _emscripten_bind_btConeTwistConstraint_setMaxMotorImpulseNormalized_1 = Module["_emscripten_bind_btConeTwistConstraint_setMaxMotorImpulseNormalized_1"] = function() {
 return Module["asm"]["Zd"].apply(null, arguments);
};

var _emscripten_bind_btConeTwistConstraint_setMaxMotorImpulse_1 = Module["_emscripten_bind_btConeTwistConstraint_setMaxMotorImpulse_1"] = function() {
 return Module["asm"]["_d"].apply(null, arguments);
};

var _emscripten_bind_btConeTwistConstraint_setMotorTargetInConstraintSpace_1 = Module["_emscripten_bind_btConeTwistConstraint_setMotorTargetInConstraintSpace_1"] = function() {
 return Module["asm"]["$d"].apply(null, arguments);
};

var _emscripten_bind_btConeTwistConstraint_setMotorTarget_1 = Module["_emscripten_bind_btConeTwistConstraint_setMotorTarget_1"] = function() {
 return Module["asm"]["ae"].apply(null, arguments);
};

var _emscripten_bind_btConeTwistConstraint_setParam_3 = Module["_emscripten_bind_btConeTwistConstraint_setParam_3"] = function() {
 return Module["asm"]["be"].apply(null, arguments);
};

var _emscripten_bind_btConstraintSetting___destroy___0 = Module["_emscripten_bind_btConstraintSetting___destroy___0"] = function() {
 return Module["asm"]["ce"].apply(null, arguments);
};

var _emscripten_bind_btConstraintSetting_btConstraintSetting_0 = Module["_emscripten_bind_btConstraintSetting_btConstraintSetting_0"] = function() {
 return Module["asm"]["de"].apply(null, arguments);
};

var _emscripten_bind_btConstraintSetting_get_m_damping_0 = Module["_emscripten_bind_btConstraintSetting_get_m_damping_0"] = function() {
 return Module["asm"]["ee"].apply(null, arguments);
};

var _emscripten_bind_btConstraintSetting_get_m_impulseClamp_0 = Module["_emscripten_bind_btConstraintSetting_get_m_impulseClamp_0"] = function() {
 return Module["asm"]["fe"].apply(null, arguments);
};

var _emscripten_bind_btConstraintSetting_get_m_tau_0 = Module["_emscripten_bind_btConstraintSetting_get_m_tau_0"] = function() {
 return Module["asm"]["ge"].apply(null, arguments);
};

var _emscripten_bind_btConstraintSetting_set_m_damping_1 = Module["_emscripten_bind_btConstraintSetting_set_m_damping_1"] = function() {
 return Module["asm"]["he"].apply(null, arguments);
};

var _emscripten_bind_btConstraintSetting_set_m_impulseClamp_1 = Module["_emscripten_bind_btConstraintSetting_set_m_impulseClamp_1"] = function() {
 return Module["asm"]["ie"].apply(null, arguments);
};

var _emscripten_bind_btConstraintSetting_set_m_tau_1 = Module["_emscripten_bind_btConstraintSetting_set_m_tau_1"] = function() {
 return Module["asm"]["je"].apply(null, arguments);
};

var _emscripten_bind_btConstraintSolver___destroy___0 = Module["_emscripten_bind_btConstraintSolver___destroy___0"] = function() {
 return Module["asm"]["ke"].apply(null, arguments);
};

var _emscripten_bind_btContactSolverInfo___destroy___0 = Module["_emscripten_bind_btContactSolverInfo___destroy___0"] = function() {
 return Module["asm"]["le"].apply(null, arguments);
};

var _emscripten_bind_btContactSolverInfo_get_m_numIterations_0 = Module["_emscripten_bind_btContactSolverInfo_get_m_numIterations_0"] = function() {
 return Module["asm"]["me"].apply(null, arguments);
};

var _emscripten_bind_btContactSolverInfo_get_m_splitImpulsePenetrationThreshold_0 = Module["_emscripten_bind_btContactSolverInfo_get_m_splitImpulsePenetrationThreshold_0"] = function() {
 return Module["asm"]["ne"].apply(null, arguments);
};

var _emscripten_bind_btContactSolverInfo_get_m_splitImpulse_0 = Module["_emscripten_bind_btContactSolverInfo_get_m_splitImpulse_0"] = function() {
 return Module["asm"]["oe"].apply(null, arguments);
};

var _emscripten_bind_btContactSolverInfo_set_m_numIterations_1 = Module["_emscripten_bind_btContactSolverInfo_set_m_numIterations_1"] = function() {
 return Module["asm"]["pe"].apply(null, arguments);
};

var _emscripten_bind_btContactSolverInfo_set_m_splitImpulsePenetrationThreshold_1 = Module["_emscripten_bind_btContactSolverInfo_set_m_splitImpulsePenetrationThreshold_1"] = function() {
 return Module["asm"]["qe"].apply(null, arguments);
};

var _emscripten_bind_btContactSolverInfo_set_m_splitImpulse_1 = Module["_emscripten_bind_btContactSolverInfo_set_m_splitImpulse_1"] = function() {
 return Module["asm"]["re"].apply(null, arguments);
};

var _emscripten_bind_btConvexHullShape___destroy___0 = Module["_emscripten_bind_btConvexHullShape___destroy___0"] = function() {
 return Module["asm"]["se"].apply(null, arguments);
};

var _emscripten_bind_btConvexHullShape_addPoint_1 = Module["_emscripten_bind_btConvexHullShape_addPoint_1"] = function() {
 return Module["asm"]["te"].apply(null, arguments);
};

var _emscripten_bind_btConvexHullShape_addPoint_2 = Module["_emscripten_bind_btConvexHullShape_addPoint_2"] = function() {
 return Module["asm"]["ue"].apply(null, arguments);
};

var _emscripten_bind_btConvexHullShape_btConvexHullShape_0 = Module["_emscripten_bind_btConvexHullShape_btConvexHullShape_0"] = function() {
 return Module["asm"]["ve"].apply(null, arguments);
};

var _emscripten_bind_btConvexHullShape_btConvexHullShape_1 = Module["_emscripten_bind_btConvexHullShape_btConvexHullShape_1"] = function() {
 return Module["asm"]["we"].apply(null, arguments);
};

var _emscripten_bind_btConvexHullShape_btConvexHullShape_2 = Module["_emscripten_bind_btConvexHullShape_btConvexHullShape_2"] = function() {
 return Module["asm"]["xe"].apply(null, arguments);
};

var _emscripten_bind_btConvexHullShape_calculateLocalInertia_2 = Module["_emscripten_bind_btConvexHullShape_calculateLocalInertia_2"] = function() {
 return Module["asm"]["ye"].apply(null, arguments);
};

var _emscripten_bind_btConvexHullShape_getConvexPolyhedron_0 = Module["_emscripten_bind_btConvexHullShape_getConvexPolyhedron_0"] = function() {
 return Module["asm"]["ze"].apply(null, arguments);
};

var _emscripten_bind_btConvexHullShape_getLocalScaling_0 = Module["_emscripten_bind_btConvexHullShape_getLocalScaling_0"] = function() {
 return Module["asm"]["Ae"].apply(null, arguments);
};

var _emscripten_bind_btConvexHullShape_getMargin_0 = Module["_emscripten_bind_btConvexHullShape_getMargin_0"] = function() {
 return Module["asm"]["Be"].apply(null, arguments);
};

var _emscripten_bind_btConvexHullShape_getNumVertices_0 = Module["_emscripten_bind_btConvexHullShape_getNumVertices_0"] = function() {
 return Module["asm"]["Ce"].apply(null, arguments);
};

var _emscripten_bind_btConvexHullShape_initializePolyhedralFeatures_1 = Module["_emscripten_bind_btConvexHullShape_initializePolyhedralFeatures_1"] = function() {
 return Module["asm"]["De"].apply(null, arguments);
};

var _emscripten_bind_btConvexHullShape_recalcLocalAabb_0 = Module["_emscripten_bind_btConvexHullShape_recalcLocalAabb_0"] = function() {
 return Module["asm"]["Ee"].apply(null, arguments);
};

var _emscripten_bind_btConvexHullShape_setLocalScaling_1 = Module["_emscripten_bind_btConvexHullShape_setLocalScaling_1"] = function() {
 return Module["asm"]["Fe"].apply(null, arguments);
};

var _emscripten_bind_btConvexHullShape_setMargin_1 = Module["_emscripten_bind_btConvexHullShape_setMargin_1"] = function() {
 return Module["asm"]["Ge"].apply(null, arguments);
};

var _emscripten_bind_btConvexPolyhedron___destroy___0 = Module["_emscripten_bind_btConvexPolyhedron___destroy___0"] = function() {
 return Module["asm"]["He"].apply(null, arguments);
};

var _emscripten_bind_btConvexPolyhedron_get_m_faces_0 = Module["_emscripten_bind_btConvexPolyhedron_get_m_faces_0"] = function() {
 return Module["asm"]["Ie"].apply(null, arguments);
};

var _emscripten_bind_btConvexPolyhedron_get_m_vertices_0 = Module["_emscripten_bind_btConvexPolyhedron_get_m_vertices_0"] = function() {
 return Module["asm"]["Je"].apply(null, arguments);
};

var _emscripten_bind_btConvexPolyhedron_set_m_faces_1 = Module["_emscripten_bind_btConvexPolyhedron_set_m_faces_1"] = function() {
 return Module["asm"]["Ke"].apply(null, arguments);
};

var _emscripten_bind_btConvexPolyhedron_set_m_vertices_1 = Module["_emscripten_bind_btConvexPolyhedron_set_m_vertices_1"] = function() {
 return Module["asm"]["Le"].apply(null, arguments);
};

var _emscripten_bind_btConvexShape___destroy___0 = Module["_emscripten_bind_btConvexShape___destroy___0"] = function() {
 return Module["asm"]["Me"].apply(null, arguments);
};

var _emscripten_bind_btConvexShape_calculateLocalInertia_2 = Module["_emscripten_bind_btConvexShape_calculateLocalInertia_2"] = function() {
 return Module["asm"]["Ne"].apply(null, arguments);
};

var _emscripten_bind_btConvexShape_getLocalScaling_0 = Module["_emscripten_bind_btConvexShape_getLocalScaling_0"] = function() {
 return Module["asm"]["Oe"].apply(null, arguments);
};

var _emscripten_bind_btConvexShape_getMargin_0 = Module["_emscripten_bind_btConvexShape_getMargin_0"] = function() {
 return Module["asm"]["Pe"].apply(null, arguments);
};

var _emscripten_bind_btConvexShape_setLocalScaling_1 = Module["_emscripten_bind_btConvexShape_setLocalScaling_1"] = function() {
 return Module["asm"]["Qe"].apply(null, arguments);
};

var _emscripten_bind_btConvexShape_setMargin_1 = Module["_emscripten_bind_btConvexShape_setMargin_1"] = function() {
 return Module["asm"]["Re"].apply(null, arguments);
};

var _emscripten_bind_btConvexTriangleMeshShape___destroy___0 = Module["_emscripten_bind_btConvexTriangleMeshShape___destroy___0"] = function() {
 return Module["asm"]["Se"].apply(null, arguments);
};

var _emscripten_bind_btConvexTriangleMeshShape_btConvexTriangleMeshShape_1 = Module["_emscripten_bind_btConvexTriangleMeshShape_btConvexTriangleMeshShape_1"] = function() {
 return Module["asm"]["Te"].apply(null, arguments);
};

var _emscripten_bind_btConvexTriangleMeshShape_btConvexTriangleMeshShape_2 = Module["_emscripten_bind_btConvexTriangleMeshShape_btConvexTriangleMeshShape_2"] = function() {
 return Module["asm"]["Ue"].apply(null, arguments);
};

var _emscripten_bind_btConvexTriangleMeshShape_calculateLocalInertia_2 = Module["_emscripten_bind_btConvexTriangleMeshShape_calculateLocalInertia_2"] = function() {
 return Module["asm"]["Ve"].apply(null, arguments);
};

var _emscripten_bind_btConvexTriangleMeshShape_getLocalScaling_0 = Module["_emscripten_bind_btConvexTriangleMeshShape_getLocalScaling_0"] = function() {
 return Module["asm"]["We"].apply(null, arguments);
};

var _emscripten_bind_btConvexTriangleMeshShape_getMargin_0 = Module["_emscripten_bind_btConvexTriangleMeshShape_getMargin_0"] = function() {
 return Module["asm"]["Xe"].apply(null, arguments);
};

var _emscripten_bind_btConvexTriangleMeshShape_setLocalScaling_1 = Module["_emscripten_bind_btConvexTriangleMeshShape_setLocalScaling_1"] = function() {
 return Module["asm"]["Ye"].apply(null, arguments);
};

var _emscripten_bind_btConvexTriangleMeshShape_setMargin_1 = Module["_emscripten_bind_btConvexTriangleMeshShape_setMargin_1"] = function() {
 return Module["asm"]["Ze"].apply(null, arguments);
};

var _emscripten_bind_btCylinderShapeX___destroy___0 = Module["_emscripten_bind_btCylinderShapeX___destroy___0"] = function() {
 return Module["asm"]["_e"].apply(null, arguments);
};

var _emscripten_bind_btCylinderShapeX_btCylinderShapeX_1 = Module["_emscripten_bind_btCylinderShapeX_btCylinderShapeX_1"] = function() {
 return Module["asm"]["$e"].apply(null, arguments);
};

var _emscripten_bind_btCylinderShapeX_calculateLocalInertia_2 = Module["_emscripten_bind_btCylinderShapeX_calculateLocalInertia_2"] = function() {
 return Module["asm"]["af"].apply(null, arguments);
};

var _emscripten_bind_btCylinderShapeX_getLocalScaling_0 = Module["_emscripten_bind_btCylinderShapeX_getLocalScaling_0"] = function() {
 return Module["asm"]["bf"].apply(null, arguments);
};

var _emscripten_bind_btCylinderShapeX_getMargin_0 = Module["_emscripten_bind_btCylinderShapeX_getMargin_0"] = function() {
 return Module["asm"]["cf"].apply(null, arguments);
};

var _emscripten_bind_btCylinderShapeX_setLocalScaling_1 = Module["_emscripten_bind_btCylinderShapeX_setLocalScaling_1"] = function() {
 return Module["asm"]["df"].apply(null, arguments);
};

var _emscripten_bind_btCylinderShapeX_setMargin_1 = Module["_emscripten_bind_btCylinderShapeX_setMargin_1"] = function() {
 return Module["asm"]["ef"].apply(null, arguments);
};

var _emscripten_bind_btCylinderShapeZ___destroy___0 = Module["_emscripten_bind_btCylinderShapeZ___destroy___0"] = function() {
 return Module["asm"]["ff"].apply(null, arguments);
};

var _emscripten_bind_btCylinderShapeZ_btCylinderShapeZ_1 = Module["_emscripten_bind_btCylinderShapeZ_btCylinderShapeZ_1"] = function() {
 return Module["asm"]["gf"].apply(null, arguments);
};

var _emscripten_bind_btCylinderShapeZ_calculateLocalInertia_2 = Module["_emscripten_bind_btCylinderShapeZ_calculateLocalInertia_2"] = function() {
 return Module["asm"]["hf"].apply(null, arguments);
};

var _emscripten_bind_btCylinderShapeZ_getLocalScaling_0 = Module["_emscripten_bind_btCylinderShapeZ_getLocalScaling_0"] = function() {
 return Module["asm"]["jf"].apply(null, arguments);
};

var _emscripten_bind_btCylinderShapeZ_getMargin_0 = Module["_emscripten_bind_btCylinderShapeZ_getMargin_0"] = function() {
 return Module["asm"]["kf"].apply(null, arguments);
};

var _emscripten_bind_btCylinderShapeZ_setLocalScaling_1 = Module["_emscripten_bind_btCylinderShapeZ_setLocalScaling_1"] = function() {
 return Module["asm"]["lf"].apply(null, arguments);
};

var _emscripten_bind_btCylinderShapeZ_setMargin_1 = Module["_emscripten_bind_btCylinderShapeZ_setMargin_1"] = function() {
 return Module["asm"]["mf"].apply(null, arguments);
};

var _emscripten_bind_btCylinderShape___destroy___0 = Module["_emscripten_bind_btCylinderShape___destroy___0"] = function() {
 return Module["asm"]["nf"].apply(null, arguments);
};

var _emscripten_bind_btCylinderShape_btCylinderShape_1 = Module["_emscripten_bind_btCylinderShape_btCylinderShape_1"] = function() {
 return Module["asm"]["of"].apply(null, arguments);
};

var _emscripten_bind_btCylinderShape_calculateLocalInertia_2 = Module["_emscripten_bind_btCylinderShape_calculateLocalInertia_2"] = function() {
 return Module["asm"]["pf"].apply(null, arguments);
};

var _emscripten_bind_btCylinderShape_getLocalScaling_0 = Module["_emscripten_bind_btCylinderShape_getLocalScaling_0"] = function() {
 return Module["asm"]["qf"].apply(null, arguments);
};

var _emscripten_bind_btCylinderShape_getMargin_0 = Module["_emscripten_bind_btCylinderShape_getMargin_0"] = function() {
 return Module["asm"]["rf"].apply(null, arguments);
};

var _emscripten_bind_btCylinderShape_setLocalScaling_1 = Module["_emscripten_bind_btCylinderShape_setLocalScaling_1"] = function() {
 return Module["asm"]["sf"].apply(null, arguments);
};

var _emscripten_bind_btCylinderShape_setMargin_1 = Module["_emscripten_bind_btCylinderShape_setMargin_1"] = function() {
 return Module["asm"]["tf"].apply(null, arguments);
};

var _emscripten_bind_btDbvtBroadphase___destroy___0 = Module["_emscripten_bind_btDbvtBroadphase___destroy___0"] = function() {
 return Module["asm"]["uf"].apply(null, arguments);
};

var _emscripten_bind_btDbvtBroadphase_btDbvtBroadphase_0 = Module["_emscripten_bind_btDbvtBroadphase_btDbvtBroadphase_0"] = function() {
 return Module["asm"]["vf"].apply(null, arguments);
};

var _emscripten_bind_btDbvtBroadphase_getOverlappingPairCache_0 = Module["_emscripten_bind_btDbvtBroadphase_getOverlappingPairCache_0"] = function() {
 return Module["asm"]["wf"].apply(null, arguments);
};

var _emscripten_bind_btDefaultCollisionConfiguration___destroy___0 = Module["_emscripten_bind_btDefaultCollisionConfiguration___destroy___0"] = function() {
 return Module["asm"]["xf"].apply(null, arguments);
};

var _emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_0 = Module["_emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_0"] = function() {
 return Module["asm"]["yf"].apply(null, arguments);
};

var _emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_1 = Module["_emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_1"] = function() {
 return Module["asm"]["zf"].apply(null, arguments);
};

var _emscripten_bind_btDefaultCollisionConstructionInfo___destroy___0 = Module["_emscripten_bind_btDefaultCollisionConstructionInfo___destroy___0"] = function() {
 return Module["asm"]["Af"].apply(null, arguments);
};

var _emscripten_bind_btDefaultCollisionConstructionInfo_btDefaultCollisionConstructionInfo_0 = Module["_emscripten_bind_btDefaultCollisionConstructionInfo_btDefaultCollisionConstructionInfo_0"] = function() {
 return Module["asm"]["Bf"].apply(null, arguments);
};

var _emscripten_bind_btDefaultMotionState___destroy___0 = Module["_emscripten_bind_btDefaultMotionState___destroy___0"] = function() {
 return Module["asm"]["Cf"].apply(null, arguments);
};

var _emscripten_bind_btDefaultMotionState_btDefaultMotionState_0 = Module["_emscripten_bind_btDefaultMotionState_btDefaultMotionState_0"] = function() {
 return Module["asm"]["Df"].apply(null, arguments);
};

var _emscripten_bind_btDefaultMotionState_btDefaultMotionState_1 = Module["_emscripten_bind_btDefaultMotionState_btDefaultMotionState_1"] = function() {
 return Module["asm"]["Ef"].apply(null, arguments);
};

var _emscripten_bind_btDefaultMotionState_btDefaultMotionState_2 = Module["_emscripten_bind_btDefaultMotionState_btDefaultMotionState_2"] = function() {
 return Module["asm"]["Ff"].apply(null, arguments);
};

var _emscripten_bind_btDefaultMotionState_getWorldTransform_1 = Module["_emscripten_bind_btDefaultMotionState_getWorldTransform_1"] = function() {
 return Module["asm"]["Gf"].apply(null, arguments);
};

var _emscripten_bind_btDefaultMotionState_get_m_graphicsWorldTrans_0 = Module["_emscripten_bind_btDefaultMotionState_get_m_graphicsWorldTrans_0"] = function() {
 return Module["asm"]["Hf"].apply(null, arguments);
};

var _emscripten_bind_btDefaultMotionState_setWorldTransform_1 = Module["_emscripten_bind_btDefaultMotionState_setWorldTransform_1"] = function() {
 return Module["asm"]["If"].apply(null, arguments);
};

var _emscripten_bind_btDefaultMotionState_set_m_graphicsWorldTrans_1 = Module["_emscripten_bind_btDefaultMotionState_set_m_graphicsWorldTrans_1"] = function() {
 return Module["asm"]["Jf"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld___destroy___0 = Module["_emscripten_bind_btDiscreteDynamicsWorld___destroy___0"] = function() {
 return Module["asm"]["Kf"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_addAction_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addAction_1"] = function() {
 return Module["asm"]["Lf"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_1"] = function() {
 return Module["asm"]["Mf"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_2 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_2"] = function() {
 return Module["asm"]["Nf"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_3 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_3"] = function() {
 return Module["asm"]["Of"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_addConstraint_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addConstraint_1"] = function() {
 return Module["asm"]["Pf"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_addConstraint_2 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addConstraint_2"] = function() {
 return Module["asm"]["Qf"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_1"] = function() {
 return Module["asm"]["Rf"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_3 = Module["_emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_3"] = function() {
 return Module["asm"]["Sf"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_btDiscreteDynamicsWorld_4 = Module["_emscripten_bind_btDiscreteDynamicsWorld_btDiscreteDynamicsWorld_4"] = function() {
 return Module["asm"]["Tf"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_contactPairTest_3 = Module["_emscripten_bind_btDiscreteDynamicsWorld_contactPairTest_3"] = function() {
 return Module["asm"]["Uf"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_contactTest_2 = Module["_emscripten_bind_btDiscreteDynamicsWorld_contactTest_2"] = function() {
 return Module["asm"]["Vf"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_convexSweepTest_5 = Module["_emscripten_bind_btDiscreteDynamicsWorld_convexSweepTest_5"] = function() {
 return Module["asm"]["Wf"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_debugDrawObject_3 = Module["_emscripten_bind_btDiscreteDynamicsWorld_debugDrawObject_3"] = function() {
 return Module["asm"]["Xf"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_debugDrawWorld_0 = Module["_emscripten_bind_btDiscreteDynamicsWorld_debugDrawWorld_0"] = function() {
 return Module["asm"]["Yf"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_getBroadphase_0 = Module["_emscripten_bind_btDiscreteDynamicsWorld_getBroadphase_0"] = function() {
 return Module["asm"]["Zf"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_getDebugDrawer_0 = Module["_emscripten_bind_btDiscreteDynamicsWorld_getDebugDrawer_0"] = function() {
 return Module["asm"]["_f"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_getDispatchInfo_0 = Module["_emscripten_bind_btDiscreteDynamicsWorld_getDispatchInfo_0"] = function() {
 return Module["asm"]["$f"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_getDispatcher_0 = Module["_emscripten_bind_btDiscreteDynamicsWorld_getDispatcher_0"] = function() {
 return Module["asm"]["ag"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_getGravity_0 = Module["_emscripten_bind_btDiscreteDynamicsWorld_getGravity_0"] = function() {
 return Module["asm"]["bg"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_getPairCache_0 = Module["_emscripten_bind_btDiscreteDynamicsWorld_getPairCache_0"] = function() {
 return Module["asm"]["cg"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_getSolverInfo_0 = Module["_emscripten_bind_btDiscreteDynamicsWorld_getSolverInfo_0"] = function() {
 return Module["asm"]["dg"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_rayTest_3 = Module["_emscripten_bind_btDiscreteDynamicsWorld_rayTest_3"] = function() {
 return Module["asm"]["eg"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_removeAction_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_removeAction_1"] = function() {
 return Module["asm"]["fg"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_removeCollisionObject_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_removeCollisionObject_1"] = function() {
 return Module["asm"]["gg"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_removeConstraint_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_removeConstraint_1"] = function() {
 return Module["asm"]["hg"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_removeRigidBody_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_removeRigidBody_1"] = function() {
 return Module["asm"]["ig"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_setDebugDrawer_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_setDebugDrawer_1"] = function() {
 return Module["asm"]["jg"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_setForceUpdateAllAabbs_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_setForceUpdateAllAabbs_1"] = function() {
 return Module["asm"]["kg"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_setGravity_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_setGravity_1"] = function() {
 return Module["asm"]["lg"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_1"] = function() {
 return Module["asm"]["mg"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_2 = Module["_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_2"] = function() {
 return Module["asm"]["ng"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_3 = Module["_emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_3"] = function() {
 return Module["asm"]["og"].apply(null, arguments);
};

var _emscripten_bind_btDiscreteDynamicsWorld_updateSingleAabb_1 = Module["_emscripten_bind_btDiscreteDynamicsWorld_updateSingleAabb_1"] = function() {
 return Module["asm"]["pg"].apply(null, arguments);
};

var _emscripten_bind_btDispatcherInfo___destroy___0 = Module["_emscripten_bind_btDispatcherInfo___destroy___0"] = function() {
 return Module["asm"]["qg"].apply(null, arguments);
};

var _emscripten_bind_btDispatcherInfo_get_m_allowedCcdPenetration_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_allowedCcdPenetration_0"] = function() {
 return Module["asm"]["rg"].apply(null, arguments);
};

var _emscripten_bind_btDispatcherInfo_get_m_convexConservativeDistanceThreshold_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_convexConservativeDistanceThreshold_0"] = function() {
 return Module["asm"]["sg"].apply(null, arguments);
};

var _emscripten_bind_btDispatcherInfo_get_m_dispatchFunc_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_dispatchFunc_0"] = function() {
 return Module["asm"]["tg"].apply(null, arguments);
};

var _emscripten_bind_btDispatcherInfo_get_m_enableSPU_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_enableSPU_0"] = function() {
 return Module["asm"]["ug"].apply(null, arguments);
};

var _emscripten_bind_btDispatcherInfo_get_m_enableSatConvex_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_enableSatConvex_0"] = function() {
 return Module["asm"]["vg"].apply(null, arguments);
};

var _emscripten_bind_btDispatcherInfo_get_m_stepCount_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_stepCount_0"] = function() {
 return Module["asm"]["wg"].apply(null, arguments);
};

var _emscripten_bind_btDispatcherInfo_get_m_timeOfImpact_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_timeOfImpact_0"] = function() {
 return Module["asm"]["xg"].apply(null, arguments);
};

var _emscripten_bind_btDispatcherInfo_get_m_timeStep_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_timeStep_0"] = function() {
 return Module["asm"]["yg"].apply(null, arguments);
};

var _emscripten_bind_btDispatcherInfo_get_m_useContinuous_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_useContinuous_0"] = function() {
 return Module["asm"]["zg"].apply(null, arguments);
};

var _emscripten_bind_btDispatcherInfo_get_m_useConvexConservativeDistanceUtil_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_useConvexConservativeDistanceUtil_0"] = function() {
 return Module["asm"]["Ag"].apply(null, arguments);
};

var _emscripten_bind_btDispatcherInfo_get_m_useEpa_0 = Module["_emscripten_bind_btDispatcherInfo_get_m_useEpa_0"] = function() {
 return Module["asm"]["Bg"].apply(null, arguments);
};

var _emscripten_bind_btDispatcherInfo_set_m_allowedCcdPenetration_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_allowedCcdPenetration_1"] = function() {
 return Module["asm"]["Cg"].apply(null, arguments);
};

var _emscripten_bind_btDispatcherInfo_set_m_convexConservativeDistanceThreshold_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_convexConservativeDistanceThreshold_1"] = function() {
 return Module["asm"]["Dg"].apply(null, arguments);
};

var _emscripten_bind_btDispatcherInfo_set_m_dispatchFunc_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_dispatchFunc_1"] = function() {
 return Module["asm"]["Eg"].apply(null, arguments);
};

var _emscripten_bind_btDispatcherInfo_set_m_enableSPU_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_enableSPU_1"] = function() {
 return Module["asm"]["Fg"].apply(null, arguments);
};

var _emscripten_bind_btDispatcherInfo_set_m_enableSatConvex_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_enableSatConvex_1"] = function() {
 return Module["asm"]["Gg"].apply(null, arguments);
};

var _emscripten_bind_btDispatcherInfo_set_m_stepCount_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_stepCount_1"] = function() {
 return Module["asm"]["Hg"].apply(null, arguments);
};

var _emscripten_bind_btDispatcherInfo_set_m_timeOfImpact_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_timeOfImpact_1"] = function() {
 return Module["asm"]["Ig"].apply(null, arguments);
};

var _emscripten_bind_btDispatcherInfo_set_m_timeStep_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_timeStep_1"] = function() {
 return Module["asm"]["Jg"].apply(null, arguments);
};

var _emscripten_bind_btDispatcherInfo_set_m_useContinuous_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_useContinuous_1"] = function() {
 return Module["asm"]["Kg"].apply(null, arguments);
};

var _emscripten_bind_btDispatcherInfo_set_m_useConvexConservativeDistanceUtil_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_useConvexConservativeDistanceUtil_1"] = function() {
 return Module["asm"]["Lg"].apply(null, arguments);
};

var _emscripten_bind_btDispatcherInfo_set_m_useEpa_1 = Module["_emscripten_bind_btDispatcherInfo_set_m_useEpa_1"] = function() {
 return Module["asm"]["Mg"].apply(null, arguments);
};

var _emscripten_bind_btDispatcher___destroy___0 = Module["_emscripten_bind_btDispatcher___destroy___0"] = function() {
 return Module["asm"]["Ng"].apply(null, arguments);
};

var _emscripten_bind_btDispatcher_getManifoldByIndexInternal_1 = Module["_emscripten_bind_btDispatcher_getManifoldByIndexInternal_1"] = function() {
 return Module["asm"]["Og"].apply(null, arguments);
};

var _emscripten_bind_btDispatcher_getNumManifolds_0 = Module["_emscripten_bind_btDispatcher_getNumManifolds_0"] = function() {
 return Module["asm"]["Pg"].apply(null, arguments);
};

var _emscripten_bind_btDynamicsWorld___destroy___0 = Module["_emscripten_bind_btDynamicsWorld___destroy___0"] = function() {
 return Module["asm"]["Qg"].apply(null, arguments);
};

var _emscripten_bind_btDynamicsWorld_addAction_1 = Module["_emscripten_bind_btDynamicsWorld_addAction_1"] = function() {
 return Module["asm"]["Rg"].apply(null, arguments);
};

var _emscripten_bind_btDynamicsWorld_addCollisionObject_1 = Module["_emscripten_bind_btDynamicsWorld_addCollisionObject_1"] = function() {
 return Module["asm"]["Sg"].apply(null, arguments);
};

var _emscripten_bind_btDynamicsWorld_addCollisionObject_2 = Module["_emscripten_bind_btDynamicsWorld_addCollisionObject_2"] = function() {
 return Module["asm"]["Tg"].apply(null, arguments);
};

var _emscripten_bind_btDynamicsWorld_addCollisionObject_3 = Module["_emscripten_bind_btDynamicsWorld_addCollisionObject_3"] = function() {
 return Module["asm"]["Ug"].apply(null, arguments);
};

var _emscripten_bind_btDynamicsWorld_contactPairTest_3 = Module["_emscripten_bind_btDynamicsWorld_contactPairTest_3"] = function() {
 return Module["asm"]["Vg"].apply(null, arguments);
};

var _emscripten_bind_btDynamicsWorld_contactTest_2 = Module["_emscripten_bind_btDynamicsWorld_contactTest_2"] = function() {
 return Module["asm"]["Wg"].apply(null, arguments);
};

var _emscripten_bind_btDynamicsWorld_convexSweepTest_5 = Module["_emscripten_bind_btDynamicsWorld_convexSweepTest_5"] = function() {
 return Module["asm"]["Xg"].apply(null, arguments);
};

var _emscripten_bind_btDynamicsWorld_debugDrawObject_3 = Module["_emscripten_bind_btDynamicsWorld_debugDrawObject_3"] = function() {
 return Module["asm"]["Yg"].apply(null, arguments);
};

var _emscripten_bind_btDynamicsWorld_debugDrawWorld_0 = Module["_emscripten_bind_btDynamicsWorld_debugDrawWorld_0"] = function() {
 return Module["asm"]["Zg"].apply(null, arguments);
};

var _emscripten_bind_btDynamicsWorld_getBroadphase_0 = Module["_emscripten_bind_btDynamicsWorld_getBroadphase_0"] = function() {
 return Module["asm"]["_g"].apply(null, arguments);
};

var _emscripten_bind_btDynamicsWorld_getDebugDrawer_0 = Module["_emscripten_bind_btDynamicsWorld_getDebugDrawer_0"] = function() {
 return Module["asm"]["$g"].apply(null, arguments);
};

var _emscripten_bind_btDynamicsWorld_getDispatchInfo_0 = Module["_emscripten_bind_btDynamicsWorld_getDispatchInfo_0"] = function() {
 return Module["asm"]["ah"].apply(null, arguments);
};

var _emscripten_bind_btDynamicsWorld_getDispatcher_0 = Module["_emscripten_bind_btDynamicsWorld_getDispatcher_0"] = function() {
 return Module["asm"]["bh"].apply(null, arguments);
};

var _emscripten_bind_btDynamicsWorld_getPairCache_0 = Module["_emscripten_bind_btDynamicsWorld_getPairCache_0"] = function() {
 return Module["asm"]["ch"].apply(null, arguments);
};

var _emscripten_bind_btDynamicsWorld_getSolverInfo_0 = Module["_emscripten_bind_btDynamicsWorld_getSolverInfo_0"] = function() {
 return Module["asm"]["dh"].apply(null, arguments);
};

var _emscripten_bind_btDynamicsWorld_rayTest_3 = Module["_emscripten_bind_btDynamicsWorld_rayTest_3"] = function() {
 return Module["asm"]["eh"].apply(null, arguments);
};

var _emscripten_bind_btDynamicsWorld_removeAction_1 = Module["_emscripten_bind_btDynamicsWorld_removeAction_1"] = function() {
 return Module["asm"]["fh"].apply(null, arguments);
};

var _emscripten_bind_btDynamicsWorld_removeCollisionObject_1 = Module["_emscripten_bind_btDynamicsWorld_removeCollisionObject_1"] = function() {
 return Module["asm"]["gh"].apply(null, arguments);
};

var _emscripten_bind_btDynamicsWorld_setDebugDrawer_1 = Module["_emscripten_bind_btDynamicsWorld_setDebugDrawer_1"] = function() {
 return Module["asm"]["hh"].apply(null, arguments);
};

var _emscripten_bind_btDynamicsWorld_setForceUpdateAllAabbs_1 = Module["_emscripten_bind_btDynamicsWorld_setForceUpdateAllAabbs_1"] = function() {
 return Module["asm"]["ih"].apply(null, arguments);
};

var _emscripten_bind_btDynamicsWorld_updateSingleAabb_1 = Module["_emscripten_bind_btDynamicsWorld_updateSingleAabb_1"] = function() {
 return Module["asm"]["jh"].apply(null, arguments);
};

var _emscripten_bind_btFaceArray___destroy___0 = Module["_emscripten_bind_btFaceArray___destroy___0"] = function() {
 return Module["asm"]["kh"].apply(null, arguments);
};

var _emscripten_bind_btFaceArray_at_1 = Module["_emscripten_bind_btFaceArray_at_1"] = function() {
 return Module["asm"]["lh"].apply(null, arguments);
};

var _emscripten_bind_btFaceArray_size_0 = Module["_emscripten_bind_btFaceArray_size_0"] = function() {
 return Module["asm"]["mh"].apply(null, arguments);
};

var _emscripten_bind_btFace___destroy___0 = Module["_emscripten_bind_btFace___destroy___0"] = function() {
 return Module["asm"]["nh"].apply(null, arguments);
};

var _emscripten_bind_btFace_get_m_indices_0 = Module["_emscripten_bind_btFace_get_m_indices_0"] = function() {
 return Module["asm"]["oh"].apply(null, arguments);
};

var _emscripten_bind_btFace_get_m_plane_1 = Module["_emscripten_bind_btFace_get_m_plane_1"] = function() {
 return Module["asm"]["ph"].apply(null, arguments);
};

var _emscripten_bind_btFace_set_m_indices_1 = Module["_emscripten_bind_btFace_set_m_indices_1"] = function() {
 return Module["asm"]["qh"].apply(null, arguments);
};

var _emscripten_bind_btFace_set_m_plane_2 = Module["_emscripten_bind_btFace_set_m_plane_2"] = function() {
 return Module["asm"]["rh"].apply(null, arguments);
};

var _emscripten_bind_btFixedConstraint___destroy___0 = Module["_emscripten_bind_btFixedConstraint___destroy___0"] = function() {
 return Module["asm"]["sh"].apply(null, arguments);
};

var _emscripten_bind_btFixedConstraint_btFixedConstraint_4 = Module["_emscripten_bind_btFixedConstraint_btFixedConstraint_4"] = function() {
 return Module["asm"]["th"].apply(null, arguments);
};

var _emscripten_bind_btFixedConstraint_enableFeedback_1 = Module["_emscripten_bind_btFixedConstraint_enableFeedback_1"] = function() {
 return Module["asm"]["uh"].apply(null, arguments);
};

var _emscripten_bind_btFixedConstraint_getBreakingImpulseThreshold_0 = Module["_emscripten_bind_btFixedConstraint_getBreakingImpulseThreshold_0"] = function() {
 return Module["asm"]["vh"].apply(null, arguments);
};

var _emscripten_bind_btFixedConstraint_getParam_2 = Module["_emscripten_bind_btFixedConstraint_getParam_2"] = function() {
 return Module["asm"]["wh"].apply(null, arguments);
};

var _emscripten_bind_btFixedConstraint_setBreakingImpulseThreshold_1 = Module["_emscripten_bind_btFixedConstraint_setBreakingImpulseThreshold_1"] = function() {
 return Module["asm"]["xh"].apply(null, arguments);
};

var _emscripten_bind_btFixedConstraint_setParam_3 = Module["_emscripten_bind_btFixedConstraint_setParam_3"] = function() {
 return Module["asm"]["yh"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofConstraint___destroy___0 = Module["_emscripten_bind_btGeneric6DofConstraint___destroy___0"] = function() {
 return Module["asm"]["zh"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofConstraint_btGeneric6DofConstraint_3 = Module["_emscripten_bind_btGeneric6DofConstraint_btGeneric6DofConstraint_3"] = function() {
 return Module["asm"]["Ah"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofConstraint_btGeneric6DofConstraint_5 = Module["_emscripten_bind_btGeneric6DofConstraint_btGeneric6DofConstraint_5"] = function() {
 return Module["asm"]["Bh"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofConstraint_enableFeedback_1 = Module["_emscripten_bind_btGeneric6DofConstraint_enableFeedback_1"] = function() {
 return Module["asm"]["Ch"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofConstraint_getBreakingImpulseThreshold_0 = Module["_emscripten_bind_btGeneric6DofConstraint_getBreakingImpulseThreshold_0"] = function() {
 return Module["asm"]["Dh"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofConstraint_getFrameOffsetA_0 = Module["_emscripten_bind_btGeneric6DofConstraint_getFrameOffsetA_0"] = function() {
 return Module["asm"]["Eh"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofConstraint_getParam_2 = Module["_emscripten_bind_btGeneric6DofConstraint_getParam_2"] = function() {
 return Module["asm"]["Fh"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofConstraint_setAngularLowerLimit_1 = Module["_emscripten_bind_btGeneric6DofConstraint_setAngularLowerLimit_1"] = function() {
 return Module["asm"]["Gh"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofConstraint_setAngularUpperLimit_1 = Module["_emscripten_bind_btGeneric6DofConstraint_setAngularUpperLimit_1"] = function() {
 return Module["asm"]["Hh"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofConstraint_setBreakingImpulseThreshold_1 = Module["_emscripten_bind_btGeneric6DofConstraint_setBreakingImpulseThreshold_1"] = function() {
 return Module["asm"]["Ih"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofConstraint_setLinearLowerLimit_1 = Module["_emscripten_bind_btGeneric6DofConstraint_setLinearLowerLimit_1"] = function() {
 return Module["asm"]["Jh"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofConstraint_setLinearUpperLimit_1 = Module["_emscripten_bind_btGeneric6DofConstraint_setLinearUpperLimit_1"] = function() {
 return Module["asm"]["Kh"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofConstraint_setParam_3 = Module["_emscripten_bind_btGeneric6DofConstraint_setParam_3"] = function() {
 return Module["asm"]["Lh"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofSpringConstraint___destroy___0 = Module["_emscripten_bind_btGeneric6DofSpringConstraint___destroy___0"] = function() {
 return Module["asm"]["Mh"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofSpringConstraint_btGeneric6DofSpringConstraint_3 = Module["_emscripten_bind_btGeneric6DofSpringConstraint_btGeneric6DofSpringConstraint_3"] = function() {
 return Module["asm"]["Nh"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofSpringConstraint_btGeneric6DofSpringConstraint_5 = Module["_emscripten_bind_btGeneric6DofSpringConstraint_btGeneric6DofSpringConstraint_5"] = function() {
 return Module["asm"]["Oh"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofSpringConstraint_enableFeedback_1 = Module["_emscripten_bind_btGeneric6DofSpringConstraint_enableFeedback_1"] = function() {
 return Module["asm"]["Ph"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofSpringConstraint_enableSpring_2 = Module["_emscripten_bind_btGeneric6DofSpringConstraint_enableSpring_2"] = function() {
 return Module["asm"]["Qh"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofSpringConstraint_getBreakingImpulseThreshold_0 = Module["_emscripten_bind_btGeneric6DofSpringConstraint_getBreakingImpulseThreshold_0"] = function() {
 return Module["asm"]["Rh"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofSpringConstraint_getFrameOffsetA_0 = Module["_emscripten_bind_btGeneric6DofSpringConstraint_getFrameOffsetA_0"] = function() {
 return Module["asm"]["Sh"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofSpringConstraint_getParam_2 = Module["_emscripten_bind_btGeneric6DofSpringConstraint_getParam_2"] = function() {
 return Module["asm"]["Th"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofSpringConstraint_setAngularLowerLimit_1 = Module["_emscripten_bind_btGeneric6DofSpringConstraint_setAngularLowerLimit_1"] = function() {
 return Module["asm"]["Uh"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofSpringConstraint_setAngularUpperLimit_1 = Module["_emscripten_bind_btGeneric6DofSpringConstraint_setAngularUpperLimit_1"] = function() {
 return Module["asm"]["Vh"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofSpringConstraint_setBreakingImpulseThreshold_1 = Module["_emscripten_bind_btGeneric6DofSpringConstraint_setBreakingImpulseThreshold_1"] = function() {
 return Module["asm"]["Wh"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofSpringConstraint_setDamping_2 = Module["_emscripten_bind_btGeneric6DofSpringConstraint_setDamping_2"] = function() {
 return Module["asm"]["Xh"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofSpringConstraint_setLinearLowerLimit_1 = Module["_emscripten_bind_btGeneric6DofSpringConstraint_setLinearLowerLimit_1"] = function() {
 return Module["asm"]["Yh"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofSpringConstraint_setLinearUpperLimit_1 = Module["_emscripten_bind_btGeneric6DofSpringConstraint_setLinearUpperLimit_1"] = function() {
 return Module["asm"]["Zh"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofSpringConstraint_setParam_3 = Module["_emscripten_bind_btGeneric6DofSpringConstraint_setParam_3"] = function() {
 return Module["asm"]["_h"].apply(null, arguments);
};

var _emscripten_bind_btGeneric6DofSpringConstraint_setStiffness_2 = Module["_emscripten_bind_btGeneric6DofSpringConstraint_setStiffness_2"] = function() {
 return Module["asm"]["$h"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject___destroy___0 = Module["_emscripten_bind_btGhostObject___destroy___0"] = function() {
 return Module["asm"]["ai"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_activate_0 = Module["_emscripten_bind_btGhostObject_activate_0"] = function() {
 return Module["asm"]["bi"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_activate_1 = Module["_emscripten_bind_btGhostObject_activate_1"] = function() {
 return Module["asm"]["ci"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_btGhostObject_0 = Module["_emscripten_bind_btGhostObject_btGhostObject_0"] = function() {
 return Module["asm"]["di"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_forceActivationState_1 = Module["_emscripten_bind_btGhostObject_forceActivationState_1"] = function() {
 return Module["asm"]["ei"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_getCollisionFlags_0 = Module["_emscripten_bind_btGhostObject_getCollisionFlags_0"] = function() {
 return Module["asm"]["fi"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_getCollisionShape_0 = Module["_emscripten_bind_btGhostObject_getCollisionShape_0"] = function() {
 return Module["asm"]["gi"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_getNumOverlappingObjects_0 = Module["_emscripten_bind_btGhostObject_getNumOverlappingObjects_0"] = function() {
 return Module["asm"]["hi"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_getOverlappingObject_1 = Module["_emscripten_bind_btGhostObject_getOverlappingObject_1"] = function() {
 return Module["asm"]["ii"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_getUserIndex_0 = Module["_emscripten_bind_btGhostObject_getUserIndex_0"] = function() {
 return Module["asm"]["ji"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_getUserPointer_0 = Module["_emscripten_bind_btGhostObject_getUserPointer_0"] = function() {
 return Module["asm"]["ki"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_getWorldTransform_0 = Module["_emscripten_bind_btGhostObject_getWorldTransform_0"] = function() {
 return Module["asm"]["li"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_isActive_0 = Module["_emscripten_bind_btGhostObject_isActive_0"] = function() {
 return Module["asm"]["mi"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_isKinematicObject_0 = Module["_emscripten_bind_btGhostObject_isKinematicObject_0"] = function() {
 return Module["asm"]["ni"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_isStaticObject_0 = Module["_emscripten_bind_btGhostObject_isStaticObject_0"] = function() {
 return Module["asm"]["oi"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_isStaticOrKinematicObject_0 = Module["_emscripten_bind_btGhostObject_isStaticOrKinematicObject_0"] = function() {
 return Module["asm"]["pi"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_setActivationState_1 = Module["_emscripten_bind_btGhostObject_setActivationState_1"] = function() {
 return Module["asm"]["qi"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_setAnisotropicFriction_2 = Module["_emscripten_bind_btGhostObject_setAnisotropicFriction_2"] = function() {
 return Module["asm"]["ri"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_setCcdMotionThreshold_1 = Module["_emscripten_bind_btGhostObject_setCcdMotionThreshold_1"] = function() {
 return Module["asm"]["si"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_setCcdSweptSphereRadius_1 = Module["_emscripten_bind_btGhostObject_setCcdSweptSphereRadius_1"] = function() {
 return Module["asm"]["ti"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_setCollisionFlags_1 = Module["_emscripten_bind_btGhostObject_setCollisionFlags_1"] = function() {
 return Module["asm"]["ui"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_setCollisionShape_1 = Module["_emscripten_bind_btGhostObject_setCollisionShape_1"] = function() {
 return Module["asm"]["vi"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_setContactProcessingThreshold_1 = Module["_emscripten_bind_btGhostObject_setContactProcessingThreshold_1"] = function() {
 return Module["asm"]["wi"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_setFriction_1 = Module["_emscripten_bind_btGhostObject_setFriction_1"] = function() {
 return Module["asm"]["xi"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_setRestitution_1 = Module["_emscripten_bind_btGhostObject_setRestitution_1"] = function() {
 return Module["asm"]["yi"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_setRollingFriction_1 = Module["_emscripten_bind_btGhostObject_setRollingFriction_1"] = function() {
 return Module["asm"]["zi"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_setUserIndex_1 = Module["_emscripten_bind_btGhostObject_setUserIndex_1"] = function() {
 return Module["asm"]["Ai"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_setUserPointer_1 = Module["_emscripten_bind_btGhostObject_setUserPointer_1"] = function() {
 return Module["asm"]["Bi"].apply(null, arguments);
};

var _emscripten_bind_btGhostObject_setWorldTransform_1 = Module["_emscripten_bind_btGhostObject_setWorldTransform_1"] = function() {
 return Module["asm"]["Ci"].apply(null, arguments);
};

var _emscripten_bind_btGhostPairCallback___destroy___0 = Module["_emscripten_bind_btGhostPairCallback___destroy___0"] = function() {
 return Module["asm"]["Di"].apply(null, arguments);
};

var _emscripten_bind_btGhostPairCallback_btGhostPairCallback_0 = Module["_emscripten_bind_btGhostPairCallback_btGhostPairCallback_0"] = function() {
 return Module["asm"]["Ei"].apply(null, arguments);
};

var _emscripten_bind_btHeightfieldTerrainShape___destroy___0 = Module["_emscripten_bind_btHeightfieldTerrainShape___destroy___0"] = function() {
 return Module["asm"]["Fi"].apply(null, arguments);
};

var _emscripten_bind_btHeightfieldTerrainShape_btHeightfieldTerrainShape_9 = Module["_emscripten_bind_btHeightfieldTerrainShape_btHeightfieldTerrainShape_9"] = function() {
 return Module["asm"]["Gi"].apply(null, arguments);
};

var _emscripten_bind_btHeightfieldTerrainShape_calculateLocalInertia_2 = Module["_emscripten_bind_btHeightfieldTerrainShape_calculateLocalInertia_2"] = function() {
 return Module["asm"]["Hi"].apply(null, arguments);
};

var _emscripten_bind_btHeightfieldTerrainShape_getLocalScaling_0 = Module["_emscripten_bind_btHeightfieldTerrainShape_getLocalScaling_0"] = function() {
 return Module["asm"]["Ii"].apply(null, arguments);
};

var _emscripten_bind_btHeightfieldTerrainShape_getMargin_0 = Module["_emscripten_bind_btHeightfieldTerrainShape_getMargin_0"] = function() {
 return Module["asm"]["Ji"].apply(null, arguments);
};

var _emscripten_bind_btHeightfieldTerrainShape_setLocalScaling_1 = Module["_emscripten_bind_btHeightfieldTerrainShape_setLocalScaling_1"] = function() {
 return Module["asm"]["Ki"].apply(null, arguments);
};

var _emscripten_bind_btHeightfieldTerrainShape_setMargin_1 = Module["_emscripten_bind_btHeightfieldTerrainShape_setMargin_1"] = function() {
 return Module["asm"]["Li"].apply(null, arguments);
};

var _emscripten_bind_btHingeConstraint___destroy___0 = Module["_emscripten_bind_btHingeConstraint___destroy___0"] = function() {
 return Module["asm"]["Mi"].apply(null, arguments);
};

var _emscripten_bind_btHingeConstraint_btHingeConstraint_2 = Module["_emscripten_bind_btHingeConstraint_btHingeConstraint_2"] = function() {
 return Module["asm"]["Ni"].apply(null, arguments);
};

var _emscripten_bind_btHingeConstraint_btHingeConstraint_3 = Module["_emscripten_bind_btHingeConstraint_btHingeConstraint_3"] = function() {
 return Module["asm"]["Oi"].apply(null, arguments);
};

var _emscripten_bind_btHingeConstraint_btHingeConstraint_4 = Module["_emscripten_bind_btHingeConstraint_btHingeConstraint_4"] = function() {
 return Module["asm"]["Pi"].apply(null, arguments);
};

var _emscripten_bind_btHingeConstraint_btHingeConstraint_5 = Module["_emscripten_bind_btHingeConstraint_btHingeConstraint_5"] = function() {
 return Module["asm"]["Qi"].apply(null, arguments);
};

var _emscripten_bind_btHingeConstraint_btHingeConstraint_6 = Module["_emscripten_bind_btHingeConstraint_btHingeConstraint_6"] = function() {
 return Module["asm"]["Ri"].apply(null, arguments);
};

var _emscripten_bind_btHingeConstraint_btHingeConstraint_7 = Module["_emscripten_bind_btHingeConstraint_btHingeConstraint_7"] = function() {
 return Module["asm"]["Si"].apply(null, arguments);
};

var _emscripten_bind_btHingeConstraint_enableAngularMotor_3 = Module["_emscripten_bind_btHingeConstraint_enableAngularMotor_3"] = function() {
 return Module["asm"]["Ti"].apply(null, arguments);
};

var _emscripten_bind_btHingeConstraint_enableFeedback_1 = Module["_emscripten_bind_btHingeConstraint_enableFeedback_1"] = function() {
 return Module["asm"]["Ui"].apply(null, arguments);
};

var _emscripten_bind_btHingeConstraint_enableMotor_1 = Module["_emscripten_bind_btHingeConstraint_enableMotor_1"] = function() {
 return Module["asm"]["Vi"].apply(null, arguments);
};

var _emscripten_bind_btHingeConstraint_getBreakingImpulseThreshold_0 = Module["_emscripten_bind_btHingeConstraint_getBreakingImpulseThreshold_0"] = function() {
 return Module["asm"]["Wi"].apply(null, arguments);
};

var _emscripten_bind_btHingeConstraint_getParam_2 = Module["_emscripten_bind_btHingeConstraint_getParam_2"] = function() {
 return Module["asm"]["Xi"].apply(null, arguments);
};

var _emscripten_bind_btHingeConstraint_setAngularOnly_1 = Module["_emscripten_bind_btHingeConstraint_setAngularOnly_1"] = function() {
 return Module["asm"]["Yi"].apply(null, arguments);
};

var _emscripten_bind_btHingeConstraint_setBreakingImpulseThreshold_1 = Module["_emscripten_bind_btHingeConstraint_setBreakingImpulseThreshold_1"] = function() {
 return Module["asm"]["Zi"].apply(null, arguments);
};

var _emscripten_bind_btHingeConstraint_setLimit_4 = Module["_emscripten_bind_btHingeConstraint_setLimit_4"] = function() {
 return Module["asm"]["_i"].apply(null, arguments);
};

var _emscripten_bind_btHingeConstraint_setLimit_5 = Module["_emscripten_bind_btHingeConstraint_setLimit_5"] = function() {
 return Module["asm"]["$i"].apply(null, arguments);
};

var _emscripten_bind_btHingeConstraint_setMaxMotorImpulse_1 = Module["_emscripten_bind_btHingeConstraint_setMaxMotorImpulse_1"] = function() {
 return Module["asm"]["aj"].apply(null, arguments);
};

var _emscripten_bind_btHingeConstraint_setMotorTarget_2 = Module["_emscripten_bind_btHingeConstraint_setMotorTarget_2"] = function() {
 return Module["asm"]["bj"].apply(null, arguments);
};

var _emscripten_bind_btHingeConstraint_setParam_3 = Module["_emscripten_bind_btHingeConstraint_setParam_3"] = function() {
 return Module["asm"]["cj"].apply(null, arguments);
};

var _emscripten_bind_btIDebugDraw___destroy___0 = Module["_emscripten_bind_btIDebugDraw___destroy___0"] = function() {
 return Module["asm"]["dj"].apply(null, arguments);
};

var _emscripten_bind_btIDebugDraw_draw3dText_2 = Module["_emscripten_bind_btIDebugDraw_draw3dText_2"] = function() {
 return Module["asm"]["ej"].apply(null, arguments);
};

var _emscripten_bind_btIDebugDraw_drawContactPoint_5 = Module["_emscripten_bind_btIDebugDraw_drawContactPoint_5"] = function() {
 return Module["asm"]["fj"].apply(null, arguments);
};

var _emscripten_bind_btIDebugDraw_drawLine_3 = Module["_emscripten_bind_btIDebugDraw_drawLine_3"] = function() {
 return Module["asm"]["gj"].apply(null, arguments);
};

var _emscripten_bind_btIDebugDraw_getDebugMode_0 = Module["_emscripten_bind_btIDebugDraw_getDebugMode_0"] = function() {
 return Module["asm"]["hj"].apply(null, arguments);
};

var _emscripten_bind_btIDebugDraw_reportErrorWarning_1 = Module["_emscripten_bind_btIDebugDraw_reportErrorWarning_1"] = function() {
 return Module["asm"]["ij"].apply(null, arguments);
};

var _emscripten_bind_btIDebugDraw_setDebugMode_1 = Module["_emscripten_bind_btIDebugDraw_setDebugMode_1"] = function() {
 return Module["asm"]["jj"].apply(null, arguments);
};

var _emscripten_bind_btIntArray___destroy___0 = Module["_emscripten_bind_btIntArray___destroy___0"] = function() {
 return Module["asm"]["kj"].apply(null, arguments);
};

var _emscripten_bind_btIntArray_at_1 = Module["_emscripten_bind_btIntArray_at_1"] = function() {
 return Module["asm"]["lj"].apply(null, arguments);
};

var _emscripten_bind_btIntArray_size_0 = Module["_emscripten_bind_btIntArray_size_0"] = function() {
 return Module["asm"]["mj"].apply(null, arguments);
};

var _emscripten_bind_btKinematicCharacterController___destroy___0 = Module["_emscripten_bind_btKinematicCharacterController___destroy___0"] = function() {
 return Module["asm"]["nj"].apply(null, arguments);
};

var _emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_3 = Module["_emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_3"] = function() {
 return Module["asm"]["oj"].apply(null, arguments);
};

var _emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_4 = Module["_emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_4"] = function() {
 return Module["asm"]["pj"].apply(null, arguments);
};

var _emscripten_bind_btKinematicCharacterController_canJump_0 = Module["_emscripten_bind_btKinematicCharacterController_canJump_0"] = function() {
 return Module["asm"]["qj"].apply(null, arguments);
};

var _emscripten_bind_btKinematicCharacterController_getGhostObject_0 = Module["_emscripten_bind_btKinematicCharacterController_getGhostObject_0"] = function() {
 return Module["asm"]["rj"].apply(null, arguments);
};

var _emscripten_bind_btKinematicCharacterController_getGravity_0 = Module["_emscripten_bind_btKinematicCharacterController_getGravity_0"] = function() {
 return Module["asm"]["sj"].apply(null, arguments);
};

var _emscripten_bind_btKinematicCharacterController_getMaxSlope_0 = Module["_emscripten_bind_btKinematicCharacterController_getMaxSlope_0"] = function() {
 return Module["asm"]["tj"].apply(null, arguments);
};

var _emscripten_bind_btKinematicCharacterController_jump_0 = Module["_emscripten_bind_btKinematicCharacterController_jump_0"] = function() {
 return Module["asm"]["uj"].apply(null, arguments);
};

var _emscripten_bind_btKinematicCharacterController_onGround_0 = Module["_emscripten_bind_btKinematicCharacterController_onGround_0"] = function() {
 return Module["asm"]["vj"].apply(null, arguments);
};

var _emscripten_bind_btKinematicCharacterController_playerStep_2 = Module["_emscripten_bind_btKinematicCharacterController_playerStep_2"] = function() {
 return Module["asm"]["wj"].apply(null, arguments);
};

var _emscripten_bind_btKinematicCharacterController_preStep_1 = Module["_emscripten_bind_btKinematicCharacterController_preStep_1"] = function() {
 return Module["asm"]["xj"].apply(null, arguments);
};

var _emscripten_bind_btKinematicCharacterController_setFallSpeed_1 = Module["_emscripten_bind_btKinematicCharacterController_setFallSpeed_1"] = function() {
 return Module["asm"]["yj"].apply(null, arguments);
};

var _emscripten_bind_btKinematicCharacterController_setGravity_1 = Module["_emscripten_bind_btKinematicCharacterController_setGravity_1"] = function() {
 return Module["asm"]["zj"].apply(null, arguments);
};

var _emscripten_bind_btKinematicCharacterController_setJumpSpeed_1 = Module["_emscripten_bind_btKinematicCharacterController_setJumpSpeed_1"] = function() {
 return Module["asm"]["Aj"].apply(null, arguments);
};

var _emscripten_bind_btKinematicCharacterController_setMaxJumpHeight_1 = Module["_emscripten_bind_btKinematicCharacterController_setMaxJumpHeight_1"] = function() {
 return Module["asm"]["Bj"].apply(null, arguments);
};

var _emscripten_bind_btKinematicCharacterController_setMaxSlope_1 = Module["_emscripten_bind_btKinematicCharacterController_setMaxSlope_1"] = function() {
 return Module["asm"]["Cj"].apply(null, arguments);
};

var _emscripten_bind_btKinematicCharacterController_setUpAxis_1 = Module["_emscripten_bind_btKinematicCharacterController_setUpAxis_1"] = function() {
 return Module["asm"]["Dj"].apply(null, arguments);
};

var _emscripten_bind_btKinematicCharacterController_setUpInterpolate_1 = Module["_emscripten_bind_btKinematicCharacterController_setUpInterpolate_1"] = function() {
 return Module["asm"]["Ej"].apply(null, arguments);
};

var _emscripten_bind_btKinematicCharacterController_setUseGhostSweepTest_1 = Module["_emscripten_bind_btKinematicCharacterController_setUseGhostSweepTest_1"] = function() {
 return Module["asm"]["Fj"].apply(null, arguments);
};

var _emscripten_bind_btKinematicCharacterController_setVelocityForTimeInterval_2 = Module["_emscripten_bind_btKinematicCharacterController_setVelocityForTimeInterval_2"] = function() {
 return Module["asm"]["Gj"].apply(null, arguments);
};

var _emscripten_bind_btKinematicCharacterController_setWalkDirection_1 = Module["_emscripten_bind_btKinematicCharacterController_setWalkDirection_1"] = function() {
 return Module["asm"]["Hj"].apply(null, arguments);
};

var _emscripten_bind_btKinematicCharacterController_updateAction_2 = Module["_emscripten_bind_btKinematicCharacterController_updateAction_2"] = function() {
 return Module["asm"]["Ij"].apply(null, arguments);
};

var _emscripten_bind_btKinematicCharacterController_warp_1 = Module["_emscripten_bind_btKinematicCharacterController_warp_1"] = function() {
 return Module["asm"]["Jj"].apply(null, arguments);
};

var _emscripten_bind_btManifoldPoint___destroy___0 = Module["_emscripten_bind_btManifoldPoint___destroy___0"] = function() {
 return Module["asm"]["Kj"].apply(null, arguments);
};

var _emscripten_bind_btManifoldPoint_getAppliedImpulse_0 = Module["_emscripten_bind_btManifoldPoint_getAppliedImpulse_0"] = function() {
 return Module["asm"]["Lj"].apply(null, arguments);
};

var _emscripten_bind_btManifoldPoint_getDistance_0 = Module["_emscripten_bind_btManifoldPoint_getDistance_0"] = function() {
 return Module["asm"]["Mj"].apply(null, arguments);
};

var _emscripten_bind_btManifoldPoint_getPositionWorldOnA_0 = Module["_emscripten_bind_btManifoldPoint_getPositionWorldOnA_0"] = function() {
 return Module["asm"]["Nj"].apply(null, arguments);
};

var _emscripten_bind_btManifoldPoint_getPositionWorldOnB_0 = Module["_emscripten_bind_btManifoldPoint_getPositionWorldOnB_0"] = function() {
 return Module["asm"]["Oj"].apply(null, arguments);
};

var _emscripten_bind_btManifoldPoint_get_m_localPointA_0 = Module["_emscripten_bind_btManifoldPoint_get_m_localPointA_0"] = function() {
 return Module["asm"]["Pj"].apply(null, arguments);
};

var _emscripten_bind_btManifoldPoint_get_m_localPointB_0 = Module["_emscripten_bind_btManifoldPoint_get_m_localPointB_0"] = function() {
 return Module["asm"]["Qj"].apply(null, arguments);
};

var _emscripten_bind_btManifoldPoint_get_m_normalWorldOnB_0 = Module["_emscripten_bind_btManifoldPoint_get_m_normalWorldOnB_0"] = function() {
 return Module["asm"]["Rj"].apply(null, arguments);
};

var _emscripten_bind_btManifoldPoint_get_m_positionWorldOnA_0 = Module["_emscripten_bind_btManifoldPoint_get_m_positionWorldOnA_0"] = function() {
 return Module["asm"]["Sj"].apply(null, arguments);
};

var _emscripten_bind_btManifoldPoint_get_m_positionWorldOnB_0 = Module["_emscripten_bind_btManifoldPoint_get_m_positionWorldOnB_0"] = function() {
 return Module["asm"]["Tj"].apply(null, arguments);
};

var _emscripten_bind_btManifoldPoint_set_m_localPointA_1 = Module["_emscripten_bind_btManifoldPoint_set_m_localPointA_1"] = function() {
 return Module["asm"]["Uj"].apply(null, arguments);
};

var _emscripten_bind_btManifoldPoint_set_m_localPointB_1 = Module["_emscripten_bind_btManifoldPoint_set_m_localPointB_1"] = function() {
 return Module["asm"]["Vj"].apply(null, arguments);
};

var _emscripten_bind_btManifoldPoint_set_m_normalWorldOnB_1 = Module["_emscripten_bind_btManifoldPoint_set_m_normalWorldOnB_1"] = function() {
 return Module["asm"]["Wj"].apply(null, arguments);
};

var _emscripten_bind_btManifoldPoint_set_m_positionWorldOnA_1 = Module["_emscripten_bind_btManifoldPoint_set_m_positionWorldOnA_1"] = function() {
 return Module["asm"]["Xj"].apply(null, arguments);
};

var _emscripten_bind_btManifoldPoint_set_m_positionWorldOnB_1 = Module["_emscripten_bind_btManifoldPoint_set_m_positionWorldOnB_1"] = function() {
 return Module["asm"]["Yj"].apply(null, arguments);
};

var _emscripten_bind_btMatrix3x3___destroy___0 = Module["_emscripten_bind_btMatrix3x3___destroy___0"] = function() {
 return Module["asm"]["Zj"].apply(null, arguments);
};

var _emscripten_bind_btMatrix3x3_getRotation_1 = Module["_emscripten_bind_btMatrix3x3_getRotation_1"] = function() {
 return Module["asm"]["_j"].apply(null, arguments);
};

var _emscripten_bind_btMatrix3x3_getRow_1 = Module["_emscripten_bind_btMatrix3x3_getRow_1"] = function() {
 return Module["asm"]["$j"].apply(null, arguments);
};

var _emscripten_bind_btMatrix3x3_setEulerZYX_3 = Module["_emscripten_bind_btMatrix3x3_setEulerZYX_3"] = function() {
 return Module["asm"]["ak"].apply(null, arguments);
};

var _emscripten_bind_btMotionState___destroy___0 = Module["_emscripten_bind_btMotionState___destroy___0"] = function() {
 return Module["asm"]["bk"].apply(null, arguments);
};

var _emscripten_bind_btMotionState_getWorldTransform_1 = Module["_emscripten_bind_btMotionState_getWorldTransform_1"] = function() {
 return Module["asm"]["ck"].apply(null, arguments);
};

var _emscripten_bind_btMotionState_setWorldTransform_1 = Module["_emscripten_bind_btMotionState_setWorldTransform_1"] = function() {
 return Module["asm"]["dk"].apply(null, arguments);
};

var _emscripten_bind_btOverlappingPairCache___destroy___0 = Module["_emscripten_bind_btOverlappingPairCache___destroy___0"] = function() {
 return Module["asm"]["ek"].apply(null, arguments);
};

var _emscripten_bind_btOverlappingPairCache_removeOverlappingPairsContainingProxy_2 = Module["_emscripten_bind_btOverlappingPairCache_removeOverlappingPairsContainingProxy_2"] = function() {
 return Module["asm"]["fk"].apply(null, arguments);
};

var _emscripten_bind_btOverlappingPairCache_setInternalGhostPairCallback_1 = Module["_emscripten_bind_btOverlappingPairCache_setInternalGhostPairCallback_1"] = function() {
 return Module["asm"]["gk"].apply(null, arguments);
};

var _emscripten_bind_btOverlappingPairCallback___destroy___0 = Module["_emscripten_bind_btOverlappingPairCallback___destroy___0"] = function() {
 return Module["asm"]["hk"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject___destroy___0 = Module["_emscripten_bind_btPairCachingGhostObject___destroy___0"] = function() {
 return Module["asm"]["ik"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_activate_0 = Module["_emscripten_bind_btPairCachingGhostObject_activate_0"] = function() {
 return Module["asm"]["jk"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_activate_1 = Module["_emscripten_bind_btPairCachingGhostObject_activate_1"] = function() {
 return Module["asm"]["kk"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_btPairCachingGhostObject_0 = Module["_emscripten_bind_btPairCachingGhostObject_btPairCachingGhostObject_0"] = function() {
 return Module["asm"]["lk"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_forceActivationState_1 = Module["_emscripten_bind_btPairCachingGhostObject_forceActivationState_1"] = function() {
 return Module["asm"]["mk"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_getCollisionFlags_0 = Module["_emscripten_bind_btPairCachingGhostObject_getCollisionFlags_0"] = function() {
 return Module["asm"]["nk"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_getCollisionShape_0 = Module["_emscripten_bind_btPairCachingGhostObject_getCollisionShape_0"] = function() {
 return Module["asm"]["ok"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_getNumOverlappingObjects_0 = Module["_emscripten_bind_btPairCachingGhostObject_getNumOverlappingObjects_0"] = function() {
 return Module["asm"]["pk"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_getOverlappingObject_1 = Module["_emscripten_bind_btPairCachingGhostObject_getOverlappingObject_1"] = function() {
 return Module["asm"]["qk"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_getUserIndex_0 = Module["_emscripten_bind_btPairCachingGhostObject_getUserIndex_0"] = function() {
 return Module["asm"]["rk"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_getUserPointer_0 = Module["_emscripten_bind_btPairCachingGhostObject_getUserPointer_0"] = function() {
 return Module["asm"]["sk"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_getWorldTransform_0 = Module["_emscripten_bind_btPairCachingGhostObject_getWorldTransform_0"] = function() {
 return Module["asm"]["tk"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_isActive_0 = Module["_emscripten_bind_btPairCachingGhostObject_isActive_0"] = function() {
 return Module["asm"]["uk"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_isKinematicObject_0 = Module["_emscripten_bind_btPairCachingGhostObject_isKinematicObject_0"] = function() {
 return Module["asm"]["vk"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_isStaticObject_0 = Module["_emscripten_bind_btPairCachingGhostObject_isStaticObject_0"] = function() {
 return Module["asm"]["wk"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_isStaticOrKinematicObject_0 = Module["_emscripten_bind_btPairCachingGhostObject_isStaticOrKinematicObject_0"] = function() {
 return Module["asm"]["xk"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_setActivationState_1 = Module["_emscripten_bind_btPairCachingGhostObject_setActivationState_1"] = function() {
 return Module["asm"]["yk"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_setAnisotropicFriction_2 = Module["_emscripten_bind_btPairCachingGhostObject_setAnisotropicFriction_2"] = function() {
 return Module["asm"]["zk"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_setCcdMotionThreshold_1 = Module["_emscripten_bind_btPairCachingGhostObject_setCcdMotionThreshold_1"] = function() {
 return Module["asm"]["Ak"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_setCcdSweptSphereRadius_1 = Module["_emscripten_bind_btPairCachingGhostObject_setCcdSweptSphereRadius_1"] = function() {
 return Module["asm"]["Bk"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_setCollisionFlags_1 = Module["_emscripten_bind_btPairCachingGhostObject_setCollisionFlags_1"] = function() {
 return Module["asm"]["Ck"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_setCollisionShape_1 = Module["_emscripten_bind_btPairCachingGhostObject_setCollisionShape_1"] = function() {
 return Module["asm"]["Dk"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_setContactProcessingThreshold_1 = Module["_emscripten_bind_btPairCachingGhostObject_setContactProcessingThreshold_1"] = function() {
 return Module["asm"]["Ek"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_setFriction_1 = Module["_emscripten_bind_btPairCachingGhostObject_setFriction_1"] = function() {
 return Module["asm"]["Fk"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_setRestitution_1 = Module["_emscripten_bind_btPairCachingGhostObject_setRestitution_1"] = function() {
 return Module["asm"]["Gk"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_setRollingFriction_1 = Module["_emscripten_bind_btPairCachingGhostObject_setRollingFriction_1"] = function() {
 return Module["asm"]["Hk"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_setUserIndex_1 = Module["_emscripten_bind_btPairCachingGhostObject_setUserIndex_1"] = function() {
 return Module["asm"]["Ik"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_setUserPointer_1 = Module["_emscripten_bind_btPairCachingGhostObject_setUserPointer_1"] = function() {
 return Module["asm"]["Jk"].apply(null, arguments);
};

var _emscripten_bind_btPairCachingGhostObject_setWorldTransform_1 = Module["_emscripten_bind_btPairCachingGhostObject_setWorldTransform_1"] = function() {
 return Module["asm"]["Kk"].apply(null, arguments);
};

var _emscripten_bind_btPersistentManifold___destroy___0 = Module["_emscripten_bind_btPersistentManifold___destroy___0"] = function() {
 return Module["asm"]["Lk"].apply(null, arguments);
};

var _emscripten_bind_btPersistentManifold_btPersistentManifold_0 = Module["_emscripten_bind_btPersistentManifold_btPersistentManifold_0"] = function() {
 return Module["asm"]["Mk"].apply(null, arguments);
};

var _emscripten_bind_btPersistentManifold_getBody0_0 = Module["_emscripten_bind_btPersistentManifold_getBody0_0"] = function() {
 return Module["asm"]["Nk"].apply(null, arguments);
};

var _emscripten_bind_btPersistentManifold_getBody1_0 = Module["_emscripten_bind_btPersistentManifold_getBody1_0"] = function() {
 return Module["asm"]["Ok"].apply(null, arguments);
};

var _emscripten_bind_btPersistentManifold_getContactPoint_1 = Module["_emscripten_bind_btPersistentManifold_getContactPoint_1"] = function() {
 return Module["asm"]["Pk"].apply(null, arguments);
};

var _emscripten_bind_btPersistentManifold_getNumContacts_0 = Module["_emscripten_bind_btPersistentManifold_getNumContacts_0"] = function() {
 return Module["asm"]["Qk"].apply(null, arguments);
};

var _emscripten_bind_btPoint2PointConstraint___destroy___0 = Module["_emscripten_bind_btPoint2PointConstraint___destroy___0"] = function() {
 return Module["asm"]["Rk"].apply(null, arguments);
};

var _emscripten_bind_btPoint2PointConstraint_btPoint2PointConstraint_2 = Module["_emscripten_bind_btPoint2PointConstraint_btPoint2PointConstraint_2"] = function() {
 return Module["asm"]["Sk"].apply(null, arguments);
};

var _emscripten_bind_btPoint2PointConstraint_btPoint2PointConstraint_4 = Module["_emscripten_bind_btPoint2PointConstraint_btPoint2PointConstraint_4"] = function() {
 return Module["asm"]["Tk"].apply(null, arguments);
};

var _emscripten_bind_btPoint2PointConstraint_enableFeedback_1 = Module["_emscripten_bind_btPoint2PointConstraint_enableFeedback_1"] = function() {
 return Module["asm"]["Uk"].apply(null, arguments);
};

var _emscripten_bind_btPoint2PointConstraint_getBreakingImpulseThreshold_0 = Module["_emscripten_bind_btPoint2PointConstraint_getBreakingImpulseThreshold_0"] = function() {
 return Module["asm"]["Vk"].apply(null, arguments);
};

var _emscripten_bind_btPoint2PointConstraint_getParam_2 = Module["_emscripten_bind_btPoint2PointConstraint_getParam_2"] = function() {
 return Module["asm"]["Wk"].apply(null, arguments);
};

var _emscripten_bind_btPoint2PointConstraint_getPivotInA_0 = Module["_emscripten_bind_btPoint2PointConstraint_getPivotInA_0"] = function() {
 return Module["asm"]["Xk"].apply(null, arguments);
};

var _emscripten_bind_btPoint2PointConstraint_getPivotInB_0 = Module["_emscripten_bind_btPoint2PointConstraint_getPivotInB_0"] = function() {
 return Module["asm"]["Yk"].apply(null, arguments);
};

var _emscripten_bind_btPoint2PointConstraint_get_m_setting_0 = Module["_emscripten_bind_btPoint2PointConstraint_get_m_setting_0"] = function() {
 return Module["asm"]["Zk"].apply(null, arguments);
};

var _emscripten_bind_btPoint2PointConstraint_setBreakingImpulseThreshold_1 = Module["_emscripten_bind_btPoint2PointConstraint_setBreakingImpulseThreshold_1"] = function() {
 return Module["asm"]["_k"].apply(null, arguments);
};

var _emscripten_bind_btPoint2PointConstraint_setParam_3 = Module["_emscripten_bind_btPoint2PointConstraint_setParam_3"] = function() {
 return Module["asm"]["$k"].apply(null, arguments);
};

var _emscripten_bind_btPoint2PointConstraint_setPivotA_1 = Module["_emscripten_bind_btPoint2PointConstraint_setPivotA_1"] = function() {
 return Module["asm"]["al"].apply(null, arguments);
};

var _emscripten_bind_btPoint2PointConstraint_setPivotB_1 = Module["_emscripten_bind_btPoint2PointConstraint_setPivotB_1"] = function() {
 return Module["asm"]["bl"].apply(null, arguments);
};

var _emscripten_bind_btPoint2PointConstraint_set_m_setting_1 = Module["_emscripten_bind_btPoint2PointConstraint_set_m_setting_1"] = function() {
 return Module["asm"]["cl"].apply(null, arguments);
};

var _emscripten_bind_btQuadWord___destroy___0 = Module["_emscripten_bind_btQuadWord___destroy___0"] = function() {
 return Module["asm"]["dl"].apply(null, arguments);
};

var _emscripten_bind_btQuadWord_setW_1 = Module["_emscripten_bind_btQuadWord_setW_1"] = function() {
 return Module["asm"]["el"].apply(null, arguments);
};

var _emscripten_bind_btQuadWord_setX_1 = Module["_emscripten_bind_btQuadWord_setX_1"] = function() {
 return Module["asm"]["fl"].apply(null, arguments);
};

var _emscripten_bind_btQuadWord_setY_1 = Module["_emscripten_bind_btQuadWord_setY_1"] = function() {
 return Module["asm"]["gl"].apply(null, arguments);
};

var _emscripten_bind_btQuadWord_setZ_1 = Module["_emscripten_bind_btQuadWord_setZ_1"] = function() {
 return Module["asm"]["hl"].apply(null, arguments);
};

var _emscripten_bind_btQuadWord_w_0 = Module["_emscripten_bind_btQuadWord_w_0"] = function() {
 return Module["asm"]["il"].apply(null, arguments);
};

var _emscripten_bind_btQuadWord_x_0 = Module["_emscripten_bind_btQuadWord_x_0"] = function() {
 return Module["asm"]["jl"].apply(null, arguments);
};

var _emscripten_bind_btQuadWord_y_0 = Module["_emscripten_bind_btQuadWord_y_0"] = function() {
 return Module["asm"]["kl"].apply(null, arguments);
};

var _emscripten_bind_btQuadWord_z_0 = Module["_emscripten_bind_btQuadWord_z_0"] = function() {
 return Module["asm"]["ll"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion___destroy___0 = Module["_emscripten_bind_btQuaternion___destroy___0"] = function() {
 return Module["asm"]["ml"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_angleShortestPath_1 = Module["_emscripten_bind_btQuaternion_angleShortestPath_1"] = function() {
 return Module["asm"]["nl"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_angle_1 = Module["_emscripten_bind_btQuaternion_angle_1"] = function() {
 return Module["asm"]["ol"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_btQuaternion_4 = Module["_emscripten_bind_btQuaternion_btQuaternion_4"] = function() {
 return Module["asm"]["pl"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_dot_1 = Module["_emscripten_bind_btQuaternion_dot_1"] = function() {
 return Module["asm"]["ql"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_getAngleShortestPath_0 = Module["_emscripten_bind_btQuaternion_getAngleShortestPath_0"] = function() {
 return Module["asm"]["rl"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_getAngle_0 = Module["_emscripten_bind_btQuaternion_getAngle_0"] = function() {
 return Module["asm"]["sl"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_getAxis_0 = Module["_emscripten_bind_btQuaternion_getAxis_0"] = function() {
 return Module["asm"]["tl"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_inverse_0 = Module["_emscripten_bind_btQuaternion_inverse_0"] = function() {
 return Module["asm"]["ul"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_length2_0 = Module["_emscripten_bind_btQuaternion_length2_0"] = function() {
 return Module["asm"]["vl"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_length_0 = Module["_emscripten_bind_btQuaternion_length_0"] = function() {
 return Module["asm"]["wl"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_normalize_0 = Module["_emscripten_bind_btQuaternion_normalize_0"] = function() {
 return Module["asm"]["xl"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_normalized_0 = Module["_emscripten_bind_btQuaternion_normalized_0"] = function() {
 return Module["asm"]["yl"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_op_add_1 = Module["_emscripten_bind_btQuaternion_op_add_1"] = function() {
 return Module["asm"]["zl"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_op_div_1 = Module["_emscripten_bind_btQuaternion_op_div_1"] = function() {
 return Module["asm"]["Al"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_op_mul_1 = Module["_emscripten_bind_btQuaternion_op_mul_1"] = function() {
 return Module["asm"]["Bl"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_op_mulq_1 = Module["_emscripten_bind_btQuaternion_op_mulq_1"] = function() {
 return Module["asm"]["Cl"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_op_sub_1 = Module["_emscripten_bind_btQuaternion_op_sub_1"] = function() {
 return Module["asm"]["Dl"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_setEulerZYX_3 = Module["_emscripten_bind_btQuaternion_setEulerZYX_3"] = function() {
 return Module["asm"]["El"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_setRotation_2 = Module["_emscripten_bind_btQuaternion_setRotation_2"] = function() {
 return Module["asm"]["Fl"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_setValue_4 = Module["_emscripten_bind_btQuaternion_setValue_4"] = function() {
 return Module["asm"]["Gl"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_setW_1 = Module["_emscripten_bind_btQuaternion_setW_1"] = function() {
 return Module["asm"]["Hl"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_setX_1 = Module["_emscripten_bind_btQuaternion_setX_1"] = function() {
 return Module["asm"]["Il"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_setY_1 = Module["_emscripten_bind_btQuaternion_setY_1"] = function() {
 return Module["asm"]["Jl"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_setZ_1 = Module["_emscripten_bind_btQuaternion_setZ_1"] = function() {
 return Module["asm"]["Kl"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_w_0 = Module["_emscripten_bind_btQuaternion_w_0"] = function() {
 return Module["asm"]["Ll"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_x_0 = Module["_emscripten_bind_btQuaternion_x_0"] = function() {
 return Module["asm"]["Ml"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_y_0 = Module["_emscripten_bind_btQuaternion_y_0"] = function() {
 return Module["asm"]["Nl"].apply(null, arguments);
};

var _emscripten_bind_btQuaternion_z_0 = Module["_emscripten_bind_btQuaternion_z_0"] = function() {
 return Module["asm"]["Ol"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo___destroy___0 = Module["_emscripten_bind_btRigidBodyConstructionInfo___destroy___0"] = function() {
 return Module["asm"]["Pl"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_3 = Module["_emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_3"] = function() {
 return Module["asm"]["Ql"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_4 = Module["_emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_4"] = function() {
 return Module["asm"]["Rl"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalAngularDampingFactor_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalAngularDampingFactor_0"] = function() {
 return Module["asm"]["Sl"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalAngularDampingThresholdSqr_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalAngularDampingThresholdSqr_0"] = function() {
 return Module["asm"]["Tl"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalDampingFactor_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalDampingFactor_0"] = function() {
 return Module["asm"]["Ul"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalDamping_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalDamping_0"] = function() {
 return Module["asm"]["Vl"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalLinearDampingThresholdSqr_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalLinearDampingThresholdSqr_0"] = function() {
 return Module["asm"]["Wl"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_angularDamping_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_angularDamping_0"] = function() {
 return Module["asm"]["Xl"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_angularSleepingThreshold_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_angularSleepingThreshold_0"] = function() {
 return Module["asm"]["Yl"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_friction_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_friction_0"] = function() {
 return Module["asm"]["Zl"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_linearDamping_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_linearDamping_0"] = function() {
 return Module["asm"]["_l"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_linearSleepingThreshold_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_linearSleepingThreshold_0"] = function() {
 return Module["asm"]["$l"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_restitution_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_restitution_0"] = function() {
 return Module["asm"]["am"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_get_m_rollingFriction_0 = Module["_emscripten_bind_btRigidBodyConstructionInfo_get_m_rollingFriction_0"] = function() {
 return Module["asm"]["bm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalAngularDampingFactor_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalAngularDampingFactor_1"] = function() {
 return Module["asm"]["cm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalAngularDampingThresholdSqr_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalAngularDampingThresholdSqr_1"] = function() {
 return Module["asm"]["dm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalDampingFactor_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalDampingFactor_1"] = function() {
 return Module["asm"]["em"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalDamping_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalDamping_1"] = function() {
 return Module["asm"]["fm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalLinearDampingThresholdSqr_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalLinearDampingThresholdSqr_1"] = function() {
 return Module["asm"]["gm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_angularDamping_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_angularDamping_1"] = function() {
 return Module["asm"]["hm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_angularSleepingThreshold_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_angularSleepingThreshold_1"] = function() {
 return Module["asm"]["im"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_friction_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_friction_1"] = function() {
 return Module["asm"]["jm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_linearDamping_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_linearDamping_1"] = function() {
 return Module["asm"]["km"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_linearSleepingThreshold_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_linearSleepingThreshold_1"] = function() {
 return Module["asm"]["lm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_restitution_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_restitution_1"] = function() {
 return Module["asm"]["mm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBodyConstructionInfo_set_m_rollingFriction_1 = Module["_emscripten_bind_btRigidBodyConstructionInfo_set_m_rollingFriction_1"] = function() {
 return Module["asm"]["nm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody___destroy___0 = Module["_emscripten_bind_btRigidBody___destroy___0"] = function() {
 return Module["asm"]["om"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_activate_0 = Module["_emscripten_bind_btRigidBody_activate_0"] = function() {
 return Module["asm"]["pm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_activate_1 = Module["_emscripten_bind_btRigidBody_activate_1"] = function() {
 return Module["asm"]["qm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_applyCentralForce_1 = Module["_emscripten_bind_btRigidBody_applyCentralForce_1"] = function() {
 return Module["asm"]["rm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_applyCentralImpulse_1 = Module["_emscripten_bind_btRigidBody_applyCentralImpulse_1"] = function() {
 return Module["asm"]["sm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_applyCentralLocalForce_1 = Module["_emscripten_bind_btRigidBody_applyCentralLocalForce_1"] = function() {
 return Module["asm"]["tm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_applyForce_2 = Module["_emscripten_bind_btRigidBody_applyForce_2"] = function() {
 return Module["asm"]["um"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_applyGravity_0 = Module["_emscripten_bind_btRigidBody_applyGravity_0"] = function() {
 return Module["asm"]["vm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_applyImpulse_2 = Module["_emscripten_bind_btRigidBody_applyImpulse_2"] = function() {
 return Module["asm"]["wm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_applyLocalTorque_1 = Module["_emscripten_bind_btRigidBody_applyLocalTorque_1"] = function() {
 return Module["asm"]["xm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_applyTorqueImpulse_1 = Module["_emscripten_bind_btRigidBody_applyTorqueImpulse_1"] = function() {
 return Module["asm"]["ym"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_applyTorque_1 = Module["_emscripten_bind_btRigidBody_applyTorque_1"] = function() {
 return Module["asm"]["zm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_btRigidBody_1 = Module["_emscripten_bind_btRigidBody_btRigidBody_1"] = function() {
 return Module["asm"]["Am"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_forceActivationState_1 = Module["_emscripten_bind_btRigidBody_forceActivationState_1"] = function() {
 return Module["asm"]["Bm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_getAabb_2 = Module["_emscripten_bind_btRigidBody_getAabb_2"] = function() {
 return Module["asm"]["Cm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_getAngularVelocity_0 = Module["_emscripten_bind_btRigidBody_getAngularVelocity_0"] = function() {
 return Module["asm"]["Dm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_getBroadphaseProxy_0 = Module["_emscripten_bind_btRigidBody_getBroadphaseProxy_0"] = function() {
 return Module["asm"]["Em"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_getCenterOfMassTransform_0 = Module["_emscripten_bind_btRigidBody_getCenterOfMassTransform_0"] = function() {
 return Module["asm"]["Fm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_getCollisionFlags_0 = Module["_emscripten_bind_btRigidBody_getCollisionFlags_0"] = function() {
 return Module["asm"]["Gm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_getCollisionShape_0 = Module["_emscripten_bind_btRigidBody_getCollisionShape_0"] = function() {
 return Module["asm"]["Hm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_getGravity_0 = Module["_emscripten_bind_btRigidBody_getGravity_0"] = function() {
 return Module["asm"]["Im"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_getLinearVelocity_0 = Module["_emscripten_bind_btRigidBody_getLinearVelocity_0"] = function() {
 return Module["asm"]["Jm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_getMotionState_0 = Module["_emscripten_bind_btRigidBody_getMotionState_0"] = function() {
 return Module["asm"]["Km"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_getUserIndex_0 = Module["_emscripten_bind_btRigidBody_getUserIndex_0"] = function() {
 return Module["asm"]["Lm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_getUserPointer_0 = Module["_emscripten_bind_btRigidBody_getUserPointer_0"] = function() {
 return Module["asm"]["Mm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_getWorldTransform_0 = Module["_emscripten_bind_btRigidBody_getWorldTransform_0"] = function() {
 return Module["asm"]["Nm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_isActive_0 = Module["_emscripten_bind_btRigidBody_isActive_0"] = function() {
 return Module["asm"]["Om"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_isKinematicObject_0 = Module["_emscripten_bind_btRigidBody_isKinematicObject_0"] = function() {
 return Module["asm"]["Pm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_isStaticObject_0 = Module["_emscripten_bind_btRigidBody_isStaticObject_0"] = function() {
 return Module["asm"]["Qm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_isStaticOrKinematicObject_0 = Module["_emscripten_bind_btRigidBody_isStaticOrKinematicObject_0"] = function() {
 return Module["asm"]["Rm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_setActivationState_1 = Module["_emscripten_bind_btRigidBody_setActivationState_1"] = function() {
 return Module["asm"]["Sm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_setAngularFactor_1 = Module["_emscripten_bind_btRigidBody_setAngularFactor_1"] = function() {
 return Module["asm"]["Tm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_setAngularVelocity_1 = Module["_emscripten_bind_btRigidBody_setAngularVelocity_1"] = function() {
 return Module["asm"]["Um"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_setAnisotropicFriction_2 = Module["_emscripten_bind_btRigidBody_setAnisotropicFriction_2"] = function() {
 return Module["asm"]["Vm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_setCcdMotionThreshold_1 = Module["_emscripten_bind_btRigidBody_setCcdMotionThreshold_1"] = function() {
 return Module["asm"]["Wm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_setCcdSweptSphereRadius_1 = Module["_emscripten_bind_btRigidBody_setCcdSweptSphereRadius_1"] = function() {
 return Module["asm"]["Xm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_setCenterOfMassTransform_1 = Module["_emscripten_bind_btRigidBody_setCenterOfMassTransform_1"] = function() {
 return Module["asm"]["Ym"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_setCollisionFlags_1 = Module["_emscripten_bind_btRigidBody_setCollisionFlags_1"] = function() {
 return Module["asm"]["Zm"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_setCollisionShape_1 = Module["_emscripten_bind_btRigidBody_setCollisionShape_1"] = function() {
 return Module["asm"]["_m"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_setContactProcessingThreshold_1 = Module["_emscripten_bind_btRigidBody_setContactProcessingThreshold_1"] = function() {
 return Module["asm"]["$m"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_setDamping_2 = Module["_emscripten_bind_btRigidBody_setDamping_2"] = function() {
 return Module["asm"]["an"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_setFriction_1 = Module["_emscripten_bind_btRigidBody_setFriction_1"] = function() {
 return Module["asm"]["bn"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_setGravity_1 = Module["_emscripten_bind_btRigidBody_setGravity_1"] = function() {
 return Module["asm"]["cn"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_setLinearFactor_1 = Module["_emscripten_bind_btRigidBody_setLinearFactor_1"] = function() {
 return Module["asm"]["dn"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_setLinearVelocity_1 = Module["_emscripten_bind_btRigidBody_setLinearVelocity_1"] = function() {
 return Module["asm"]["en"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_setMassProps_2 = Module["_emscripten_bind_btRigidBody_setMassProps_2"] = function() {
 return Module["asm"]["fn"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_setMotionState_1 = Module["_emscripten_bind_btRigidBody_setMotionState_1"] = function() {
 return Module["asm"]["gn"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_setRestitution_1 = Module["_emscripten_bind_btRigidBody_setRestitution_1"] = function() {
 return Module["asm"]["hn"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_setRollingFriction_1 = Module["_emscripten_bind_btRigidBody_setRollingFriction_1"] = function() {
 return Module["asm"]["jn"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_setSleepingThresholds_2 = Module["_emscripten_bind_btRigidBody_setSleepingThresholds_2"] = function() {
 return Module["asm"]["kn"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_setUserIndex_1 = Module["_emscripten_bind_btRigidBody_setUserIndex_1"] = function() {
 return Module["asm"]["ln"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_setUserPointer_1 = Module["_emscripten_bind_btRigidBody_setUserPointer_1"] = function() {
 return Module["asm"]["mn"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_setWorldTransform_1 = Module["_emscripten_bind_btRigidBody_setWorldTransform_1"] = function() {
 return Module["asm"]["nn"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_upcast_1 = Module["_emscripten_bind_btRigidBody_upcast_1"] = function() {
 return Module["asm"]["on"].apply(null, arguments);
};

var _emscripten_bind_btRigidBody_updateInertiaTensor_0 = Module["_emscripten_bind_btRigidBody_updateInertiaTensor_0"] = function() {
 return Module["asm"]["pn"].apply(null, arguments);
};

var _emscripten_bind_btSequentialImpulseConstraintSolver___destroy___0 = Module["_emscripten_bind_btSequentialImpulseConstraintSolver___destroy___0"] = function() {
 return Module["asm"]["qn"].apply(null, arguments);
};

var _emscripten_bind_btSequentialImpulseConstraintSolver_btSequentialImpulseConstraintSolver_0 = Module["_emscripten_bind_btSequentialImpulseConstraintSolver_btSequentialImpulseConstraintSolver_0"] = function() {
 return Module["asm"]["rn"].apply(null, arguments);
};

var _emscripten_bind_btShapeHull___destroy___0 = Module["_emscripten_bind_btShapeHull___destroy___0"] = function() {
 return Module["asm"]["sn"].apply(null, arguments);
};

var _emscripten_bind_btShapeHull_btShapeHull_1 = Module["_emscripten_bind_btShapeHull_btShapeHull_1"] = function() {
 return Module["asm"]["tn"].apply(null, arguments);
};

var _emscripten_bind_btShapeHull_buildHull_1 = Module["_emscripten_bind_btShapeHull_buildHull_1"] = function() {
 return Module["asm"]["un"].apply(null, arguments);
};

var _emscripten_bind_btShapeHull_getVertexPointer_0 = Module["_emscripten_bind_btShapeHull_getVertexPointer_0"] = function() {
 return Module["asm"]["vn"].apply(null, arguments);
};

var _emscripten_bind_btShapeHull_numVertices_0 = Module["_emscripten_bind_btShapeHull_numVertices_0"] = function() {
 return Module["asm"]["wn"].apply(null, arguments);
};

var _emscripten_bind_btSliderConstraint___destroy___0 = Module["_emscripten_bind_btSliderConstraint___destroy___0"] = function() {
 return Module["asm"]["xn"].apply(null, arguments);
};

var _emscripten_bind_btSliderConstraint_btSliderConstraint_3 = Module["_emscripten_bind_btSliderConstraint_btSliderConstraint_3"] = function() {
 return Module["asm"]["yn"].apply(null, arguments);
};

var _emscripten_bind_btSliderConstraint_btSliderConstraint_5 = Module["_emscripten_bind_btSliderConstraint_btSliderConstraint_5"] = function() {
 return Module["asm"]["zn"].apply(null, arguments);
};

var _emscripten_bind_btSliderConstraint_enableFeedback_1 = Module["_emscripten_bind_btSliderConstraint_enableFeedback_1"] = function() {
 return Module["asm"]["An"].apply(null, arguments);
};

var _emscripten_bind_btSliderConstraint_getBreakingImpulseThreshold_0 = Module["_emscripten_bind_btSliderConstraint_getBreakingImpulseThreshold_0"] = function() {
 return Module["asm"]["Bn"].apply(null, arguments);
};

var _emscripten_bind_btSliderConstraint_getParam_2 = Module["_emscripten_bind_btSliderConstraint_getParam_2"] = function() {
 return Module["asm"]["Cn"].apply(null, arguments);
};

var _emscripten_bind_btSliderConstraint_setBreakingImpulseThreshold_1 = Module["_emscripten_bind_btSliderConstraint_setBreakingImpulseThreshold_1"] = function() {
 return Module["asm"]["Dn"].apply(null, arguments);
};

var _emscripten_bind_btSliderConstraint_setLowerAngLimit_1 = Module["_emscripten_bind_btSliderConstraint_setLowerAngLimit_1"] = function() {
 return Module["asm"]["En"].apply(null, arguments);
};

var _emscripten_bind_btSliderConstraint_setLowerLinLimit_1 = Module["_emscripten_bind_btSliderConstraint_setLowerLinLimit_1"] = function() {
 return Module["asm"]["Fn"].apply(null, arguments);
};

var _emscripten_bind_btSliderConstraint_setParam_3 = Module["_emscripten_bind_btSliderConstraint_setParam_3"] = function() {
 return Module["asm"]["Gn"].apply(null, arguments);
};

var _emscripten_bind_btSliderConstraint_setUpperAngLimit_1 = Module["_emscripten_bind_btSliderConstraint_setUpperAngLimit_1"] = function() {
 return Module["asm"]["Hn"].apply(null, arguments);
};

var _emscripten_bind_btSliderConstraint_setUpperLinLimit_1 = Module["_emscripten_bind_btSliderConstraint_setUpperLinLimit_1"] = function() {
 return Module["asm"]["In"].apply(null, arguments);
};

var _emscripten_bind_btSphereShape___destroy___0 = Module["_emscripten_bind_btSphereShape___destroy___0"] = function() {
 return Module["asm"]["Jn"].apply(null, arguments);
};

var _emscripten_bind_btSphereShape_btSphereShape_1 = Module["_emscripten_bind_btSphereShape_btSphereShape_1"] = function() {
 return Module["asm"]["Kn"].apply(null, arguments);
};

var _emscripten_bind_btSphereShape_calculateLocalInertia_2 = Module["_emscripten_bind_btSphereShape_calculateLocalInertia_2"] = function() {
 return Module["asm"]["Ln"].apply(null, arguments);
};

var _emscripten_bind_btSphereShape_getLocalScaling_0 = Module["_emscripten_bind_btSphereShape_getLocalScaling_0"] = function() {
 return Module["asm"]["Mn"].apply(null, arguments);
};

var _emscripten_bind_btSphereShape_getMargin_0 = Module["_emscripten_bind_btSphereShape_getMargin_0"] = function() {
 return Module["asm"]["Nn"].apply(null, arguments);
};

var _emscripten_bind_btSphereShape_setLocalScaling_1 = Module["_emscripten_bind_btSphereShape_setLocalScaling_1"] = function() {
 return Module["asm"]["On"].apply(null, arguments);
};

var _emscripten_bind_btSphereShape_setMargin_1 = Module["_emscripten_bind_btSphereShape_setMargin_1"] = function() {
 return Module["asm"]["Pn"].apply(null, arguments);
};

var _emscripten_bind_btStaticPlaneShape___destroy___0 = Module["_emscripten_bind_btStaticPlaneShape___destroy___0"] = function() {
 return Module["asm"]["Qn"].apply(null, arguments);
};

var _emscripten_bind_btStaticPlaneShape_btStaticPlaneShape_2 = Module["_emscripten_bind_btStaticPlaneShape_btStaticPlaneShape_2"] = function() {
 return Module["asm"]["Rn"].apply(null, arguments);
};

var _emscripten_bind_btStaticPlaneShape_calculateLocalInertia_2 = Module["_emscripten_bind_btStaticPlaneShape_calculateLocalInertia_2"] = function() {
 return Module["asm"]["Sn"].apply(null, arguments);
};

var _emscripten_bind_btStaticPlaneShape_getLocalScaling_0 = Module["_emscripten_bind_btStaticPlaneShape_getLocalScaling_0"] = function() {
 return Module["asm"]["Tn"].apply(null, arguments);
};

var _emscripten_bind_btStaticPlaneShape_setLocalScaling_1 = Module["_emscripten_bind_btStaticPlaneShape_setLocalScaling_1"] = function() {
 return Module["asm"]["Un"].apply(null, arguments);
};

var _emscripten_bind_btStridingMeshInterface___destroy___0 = Module["_emscripten_bind_btStridingMeshInterface___destroy___0"] = function() {
 return Module["asm"]["Vn"].apply(null, arguments);
};

var _emscripten_bind_btStridingMeshInterface_setScaling_1 = Module["_emscripten_bind_btStridingMeshInterface_setScaling_1"] = function() {
 return Module["asm"]["Wn"].apply(null, arguments);
};

var _emscripten_bind_btTransform___destroy___0 = Module["_emscripten_bind_btTransform___destroy___0"] = function() {
 return Module["asm"]["Xn"].apply(null, arguments);
};

var _emscripten_bind_btTransform_btTransform_0 = Module["_emscripten_bind_btTransform_btTransform_0"] = function() {
 return Module["asm"]["Yn"].apply(null, arguments);
};

var _emscripten_bind_btTransform_btTransform_2 = Module["_emscripten_bind_btTransform_btTransform_2"] = function() {
 return Module["asm"]["Zn"].apply(null, arguments);
};

var _emscripten_bind_btTransform_getBasis_0 = Module["_emscripten_bind_btTransform_getBasis_0"] = function() {
 return Module["asm"]["_n"].apply(null, arguments);
};

var _emscripten_bind_btTransform_getOrigin_0 = Module["_emscripten_bind_btTransform_getOrigin_0"] = function() {
 return Module["asm"]["$n"].apply(null, arguments);
};

var _emscripten_bind_btTransform_getRotation_0 = Module["_emscripten_bind_btTransform_getRotation_0"] = function() {
 return Module["asm"]["ao"].apply(null, arguments);
};

var _emscripten_bind_btTransform_inverse_0 = Module["_emscripten_bind_btTransform_inverse_0"] = function() {
 return Module["asm"]["bo"].apply(null, arguments);
};

var _emscripten_bind_btTransform_op_mul_1 = Module["_emscripten_bind_btTransform_op_mul_1"] = function() {
 return Module["asm"]["co"].apply(null, arguments);
};

var _emscripten_bind_btTransform_setFromOpenGLMatrix_1 = Module["_emscripten_bind_btTransform_setFromOpenGLMatrix_1"] = function() {
 return Module["asm"]["eo"].apply(null, arguments);
};

var _emscripten_bind_btTransform_setIdentity_0 = Module["_emscripten_bind_btTransform_setIdentity_0"] = function() {
 return Module["asm"]["fo"].apply(null, arguments);
};

var _emscripten_bind_btTransform_setOrigin_1 = Module["_emscripten_bind_btTransform_setOrigin_1"] = function() {
 return Module["asm"]["go"].apply(null, arguments);
};

var _emscripten_bind_btTransform_setRotation_1 = Module["_emscripten_bind_btTransform_setRotation_1"] = function() {
 return Module["asm"]["ho"].apply(null, arguments);
};

var _emscripten_bind_btTriangleMeshShape___destroy___0 = Module["_emscripten_bind_btTriangleMeshShape___destroy___0"] = function() {
 return Module["asm"]["io"].apply(null, arguments);
};

var _emscripten_bind_btTriangleMeshShape_calculateLocalInertia_2 = Module["_emscripten_bind_btTriangleMeshShape_calculateLocalInertia_2"] = function() {
 return Module["asm"]["jo"].apply(null, arguments);
};

var _emscripten_bind_btTriangleMeshShape_getLocalScaling_0 = Module["_emscripten_bind_btTriangleMeshShape_getLocalScaling_0"] = function() {
 return Module["asm"]["ko"].apply(null, arguments);
};

var _emscripten_bind_btTriangleMeshShape_setLocalScaling_1 = Module["_emscripten_bind_btTriangleMeshShape_setLocalScaling_1"] = function() {
 return Module["asm"]["lo"].apply(null, arguments);
};

var _emscripten_bind_btTriangleMesh___destroy___0 = Module["_emscripten_bind_btTriangleMesh___destroy___0"] = function() {
 return Module["asm"]["mo"].apply(null, arguments);
};

var _emscripten_bind_btTriangleMesh_addTriangle_3 = Module["_emscripten_bind_btTriangleMesh_addTriangle_3"] = function() {
 return Module["asm"]["no"].apply(null, arguments);
};

var _emscripten_bind_btTriangleMesh_addTriangle_4 = Module["_emscripten_bind_btTriangleMesh_addTriangle_4"] = function() {
 return Module["asm"]["oo"].apply(null, arguments);
};

var _emscripten_bind_btTriangleMesh_btTriangleMesh_0 = Module["_emscripten_bind_btTriangleMesh_btTriangleMesh_0"] = function() {
 return Module["asm"]["po"].apply(null, arguments);
};

var _emscripten_bind_btTriangleMesh_btTriangleMesh_1 = Module["_emscripten_bind_btTriangleMesh_btTriangleMesh_1"] = function() {
 return Module["asm"]["qo"].apply(null, arguments);
};

var _emscripten_bind_btTriangleMesh_btTriangleMesh_2 = Module["_emscripten_bind_btTriangleMesh_btTriangleMesh_2"] = function() {
 return Module["asm"]["ro"].apply(null, arguments);
};

var _emscripten_bind_btTriangleMesh_setScaling_1 = Module["_emscripten_bind_btTriangleMesh_setScaling_1"] = function() {
 return Module["asm"]["so"].apply(null, arguments);
};

var _emscripten_bind_btTypedConstraint___destroy___0 = Module["_emscripten_bind_btTypedConstraint___destroy___0"] = function() {
 return Module["asm"]["to"].apply(null, arguments);
};

var _emscripten_bind_btTypedConstraint_enableFeedback_1 = Module["_emscripten_bind_btTypedConstraint_enableFeedback_1"] = function() {
 return Module["asm"]["uo"].apply(null, arguments);
};

var _emscripten_bind_btTypedConstraint_getBreakingImpulseThreshold_0 = Module["_emscripten_bind_btTypedConstraint_getBreakingImpulseThreshold_0"] = function() {
 return Module["asm"]["vo"].apply(null, arguments);
};

var _emscripten_bind_btTypedConstraint_getParam_2 = Module["_emscripten_bind_btTypedConstraint_getParam_2"] = function() {
 return Module["asm"]["wo"].apply(null, arguments);
};

var _emscripten_bind_btTypedConstraint_setBreakingImpulseThreshold_1 = Module["_emscripten_bind_btTypedConstraint_setBreakingImpulseThreshold_1"] = function() {
 return Module["asm"]["xo"].apply(null, arguments);
};

var _emscripten_bind_btTypedConstraint_setParam_3 = Module["_emscripten_bind_btTypedConstraint_setParam_3"] = function() {
 return Module["asm"]["yo"].apply(null, arguments);
};

var _emscripten_bind_btVector3Array___destroy___0 = Module["_emscripten_bind_btVector3Array___destroy___0"] = function() {
 return Module["asm"]["zo"].apply(null, arguments);
};

var _emscripten_bind_btVector3Array_at_1 = Module["_emscripten_bind_btVector3Array_at_1"] = function() {
 return Module["asm"]["Ao"].apply(null, arguments);
};

var _emscripten_bind_btVector3Array_size_0 = Module["_emscripten_bind_btVector3Array_size_0"] = function() {
 return Module["asm"]["Bo"].apply(null, arguments);
};

var _emscripten_bind_btVector3___destroy___0 = Module["_emscripten_bind_btVector3___destroy___0"] = function() {
 return Module["asm"]["Co"].apply(null, arguments);
};

var _emscripten_bind_btVector3_btVector3_0 = Module["_emscripten_bind_btVector3_btVector3_0"] = function() {
 return Module["asm"]["Do"].apply(null, arguments);
};

var _emscripten_bind_btVector3_btVector3_3 = Module["_emscripten_bind_btVector3_btVector3_3"] = function() {
 return Module["asm"]["Eo"].apply(null, arguments);
};

var _emscripten_bind_btVector3_dot_1 = Module["_emscripten_bind_btVector3_dot_1"] = function() {
 return Module["asm"]["Fo"].apply(null, arguments);
};

var _emscripten_bind_btVector3_length_0 = Module["_emscripten_bind_btVector3_length_0"] = function() {
 return Module["asm"]["Go"].apply(null, arguments);
};

var _emscripten_bind_btVector3_normalize_0 = Module["_emscripten_bind_btVector3_normalize_0"] = function() {
 return Module["asm"]["Ho"].apply(null, arguments);
};

var _emscripten_bind_btVector3_op_add_1 = Module["_emscripten_bind_btVector3_op_add_1"] = function() {
 return Module["asm"]["Io"].apply(null, arguments);
};

var _emscripten_bind_btVector3_op_mul_1 = Module["_emscripten_bind_btVector3_op_mul_1"] = function() {
 return Module["asm"]["Jo"].apply(null, arguments);
};

var _emscripten_bind_btVector3_op_sub_1 = Module["_emscripten_bind_btVector3_op_sub_1"] = function() {
 return Module["asm"]["Ko"].apply(null, arguments);
};

var _emscripten_bind_btVector3_rotate_2 = Module["_emscripten_bind_btVector3_rotate_2"] = function() {
 return Module["asm"]["Lo"].apply(null, arguments);
};

var _emscripten_bind_btVector3_setValue_3 = Module["_emscripten_bind_btVector3_setValue_3"] = function() {
 return Module["asm"]["Mo"].apply(null, arguments);
};

var _emscripten_bind_btVector3_setX_1 = Module["_emscripten_bind_btVector3_setX_1"] = function() {
 return Module["asm"]["No"].apply(null, arguments);
};

var _emscripten_bind_btVector3_setY_1 = Module["_emscripten_bind_btVector3_setY_1"] = function() {
 return Module["asm"]["Oo"].apply(null, arguments);
};

var _emscripten_bind_btVector3_setZ_1 = Module["_emscripten_bind_btVector3_setZ_1"] = function() {
 return Module["asm"]["Po"].apply(null, arguments);
};

var _emscripten_bind_btVector3_x_0 = Module["_emscripten_bind_btVector3_x_0"] = function() {
 return Module["asm"]["Qo"].apply(null, arguments);
};

var _emscripten_bind_btVector3_y_0 = Module["_emscripten_bind_btVector3_y_0"] = function() {
 return Module["asm"]["Ro"].apply(null, arguments);
};

var _emscripten_bind_btVector3_z_0 = Module["_emscripten_bind_btVector3_z_0"] = function() {
 return Module["asm"]["So"].apply(null, arguments);
};

var _emscripten_bind_btVector4___destroy___0 = Module["_emscripten_bind_btVector4___destroy___0"] = function() {
 return Module["asm"]["To"].apply(null, arguments);
};

var _emscripten_bind_btVector4_btVector4_0 = Module["_emscripten_bind_btVector4_btVector4_0"] = function() {
 return Module["asm"]["Uo"].apply(null, arguments);
};

var _emscripten_bind_btVector4_btVector4_4 = Module["_emscripten_bind_btVector4_btVector4_4"] = function() {
 return Module["asm"]["Vo"].apply(null, arguments);
};

var _emscripten_bind_btVector4_dot_1 = Module["_emscripten_bind_btVector4_dot_1"] = function() {
 return Module["asm"]["Wo"].apply(null, arguments);
};

var _emscripten_bind_btVector4_length_0 = Module["_emscripten_bind_btVector4_length_0"] = function() {
 return Module["asm"]["Xo"].apply(null, arguments);
};

var _emscripten_bind_btVector4_normalize_0 = Module["_emscripten_bind_btVector4_normalize_0"] = function() {
 return Module["asm"]["Yo"].apply(null, arguments);
};

var _emscripten_bind_btVector4_op_add_1 = Module["_emscripten_bind_btVector4_op_add_1"] = function() {
 return Module["asm"]["Zo"].apply(null, arguments);
};

var _emscripten_bind_btVector4_op_mul_1 = Module["_emscripten_bind_btVector4_op_mul_1"] = function() {
 return Module["asm"]["_o"].apply(null, arguments);
};

var _emscripten_bind_btVector4_op_sub_1 = Module["_emscripten_bind_btVector4_op_sub_1"] = function() {
 return Module["asm"]["$o"].apply(null, arguments);
};

var _emscripten_bind_btVector4_rotate_2 = Module["_emscripten_bind_btVector4_rotate_2"] = function() {
 return Module["asm"]["ap"].apply(null, arguments);
};

var _emscripten_bind_btVector4_setValue_4 = Module["_emscripten_bind_btVector4_setValue_4"] = function() {
 return Module["asm"]["bp"].apply(null, arguments);
};

var _emscripten_bind_btVector4_setX_1 = Module["_emscripten_bind_btVector4_setX_1"] = function() {
 return Module["asm"]["cp"].apply(null, arguments);
};

var _emscripten_bind_btVector4_setY_1 = Module["_emscripten_bind_btVector4_setY_1"] = function() {
 return Module["asm"]["dp"].apply(null, arguments);
};

var _emscripten_bind_btVector4_setZ_1 = Module["_emscripten_bind_btVector4_setZ_1"] = function() {
 return Module["asm"]["ep"].apply(null, arguments);
};

var _emscripten_bind_btVector4_w_0 = Module["_emscripten_bind_btVector4_w_0"] = function() {
 return Module["asm"]["fp"].apply(null, arguments);
};

var _emscripten_bind_btVector4_x_0 = Module["_emscripten_bind_btVector4_x_0"] = function() {
 return Module["asm"]["gp"].apply(null, arguments);
};

var _emscripten_bind_btVector4_y_0 = Module["_emscripten_bind_btVector4_y_0"] = function() {
 return Module["asm"]["hp"].apply(null, arguments);
};

var _emscripten_bind_btVector4_z_0 = Module["_emscripten_bind_btVector4_z_0"] = function() {
 return Module["asm"]["ip"].apply(null, arguments);
};

var _emscripten_enum_PHY_ScalarType_PHY_DOUBLE = Module["_emscripten_enum_PHY_ScalarType_PHY_DOUBLE"] = function() {
 return Module["asm"]["jp"].apply(null, arguments);
};

var _emscripten_enum_PHY_ScalarType_PHY_FIXEDPOINT88 = Module["_emscripten_enum_PHY_ScalarType_PHY_FIXEDPOINT88"] = function() {
 return Module["asm"]["kp"].apply(null, arguments);
};

var _emscripten_enum_PHY_ScalarType_PHY_FLOAT = Module["_emscripten_enum_PHY_ScalarType_PHY_FLOAT"] = function() {
 return Module["asm"]["lp"].apply(null, arguments);
};

var _emscripten_enum_PHY_ScalarType_PHY_INTEGER = Module["_emscripten_enum_PHY_ScalarType_PHY_INTEGER"] = function() {
 return Module["asm"]["mp"].apply(null, arguments);
};

var _emscripten_enum_PHY_ScalarType_PHY_SHORT = Module["_emscripten_enum_PHY_ScalarType_PHY_SHORT"] = function() {
 return Module["asm"]["np"].apply(null, arguments);
};

var _emscripten_enum_PHY_ScalarType_PHY_UCHAR = Module["_emscripten_enum_PHY_ScalarType_PHY_UCHAR"] = function() {
 return Module["asm"]["op"].apply(null, arguments);
};

var _emscripten_enum_btConstraintParams_BT_CONSTRAINT_CFM = Module["_emscripten_enum_btConstraintParams_BT_CONSTRAINT_CFM"] = function() {
 return Module["asm"]["pp"].apply(null, arguments);
};

var _emscripten_enum_btConstraintParams_BT_CONSTRAINT_ERP = Module["_emscripten_enum_btConstraintParams_BT_CONSTRAINT_ERP"] = function() {
 return Module["asm"]["qp"].apply(null, arguments);
};

var _emscripten_enum_btConstraintParams_BT_CONSTRAINT_STOP_CFM = Module["_emscripten_enum_btConstraintParams_BT_CONSTRAINT_STOP_CFM"] = function() {
 return Module["asm"]["rp"].apply(null, arguments);
};

var _emscripten_enum_btConstraintParams_BT_CONSTRAINT_STOP_ERP = Module["_emscripten_enum_btConstraintParams_BT_CONSTRAINT_STOP_ERP"] = function() {
 return Module["asm"]["sp"].apply(null, arguments);
};

var _free = Module["_free"] = function() {
 return Module["asm"]["tp"].apply(null, arguments);
};

var _malloc = Module["_malloc"] = function() {
 return Module["asm"]["up"].apply(null, arguments);
};

var dynCall_v = Module["dynCall_v"] = function() {
 return Module["asm"]["vp"].apply(null, arguments);
};

var dynCall_vi = Module["dynCall_vi"] = function() {
 return Module["asm"]["wp"].apply(null, arguments);
};

Module["asm"] = asm;

Module["UTF8ToString"] = UTF8ToString;

Module["then"] = function(func) {
 if (Module["calledRun"]) {
  func(Module);
 } else {
  var old = Module["onRuntimeInitialized"];
  Module["onRuntimeInitialized"] = function() {
   if (old) old();
   func(Module);
  };
 }
 return Module;
};

function ExitStatus(status) {
 this.name = "ExitStatus";
 this.message = "Program terminated with exit(" + status + ")";
 this.status = status;
}

ExitStatus.prototype = new Error();

ExitStatus.prototype.constructor = ExitStatus;

dependenciesFulfilled = function runCaller() {
 if (!Module["calledRun"]) run();
 if (!Module["calledRun"]) dependenciesFulfilled = runCaller;
};

function run(args) {
 args = args || Module["arguments"];
 if (runDependencies > 0) {
  return;
 }
 preRun();
 if (runDependencies > 0) return;
 if (Module["calledRun"]) return;
 function doRun() {
  if (Module["calledRun"]) return;
  Module["calledRun"] = true;
  if (ABORT) return;
  ensureInitRuntime();
  preMain();
  if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
  postRun();
 }
 if (Module["setStatus"]) {
  Module["setStatus"]("Running...");
  setTimeout(function() {
   setTimeout(function() {
    Module["setStatus"]("");
   }, 1);
   doRun();
  }, 1);
 } else {
  doRun();
 }
}

Module["run"] = run;

function abort(what) {
 if (Module["onAbort"]) {
  Module["onAbort"](what);
 }
 if (what !== undefined) {
  out(what);
  err(what);
  what = JSON.stringify(what);
 } else {
  what = "";
 }
 ABORT = true;
 EXITSTATUS = 1;
 throw "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
}

Module["abort"] = abort;

if (Module["preInit"]) {
 if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
 while (Module["preInit"].length > 0) {
  Module["preInit"].pop()();
 }
}

Module["noExitRuntime"] = true;

run();

function WrapperObject() {}

WrapperObject.prototype = Object.create(WrapperObject.prototype);

WrapperObject.prototype.constructor = WrapperObject;

WrapperObject.prototype.__class__ = WrapperObject;

WrapperObject.__cache__ = {};

Module["WrapperObject"] = WrapperObject;

function getCache(__class__) {
 return (__class__ || WrapperObject).__cache__;
}

Module["getCache"] = getCache;

function wrapPointer(ptr, __class__) {
 var cache = getCache(__class__);
 var ret = cache[ptr];
 if (ret) return ret;
 ret = Object.create((__class__ || WrapperObject).prototype);
 ret.ptr = ptr;
 return cache[ptr] = ret;
}

Module["wrapPointer"] = wrapPointer;

function castObject(obj, __class__) {
 return wrapPointer(obj.ptr, __class__);
}

Module["castObject"] = castObject;

Module["NULL"] = wrapPointer(0);

function destroy(obj) {
 if (!obj["__destroy__"]) throw "Error: Cannot destroy object. (Did you create it yourself?)";
 obj["__destroy__"]();
 delete getCache(obj.__class__)[obj.ptr];
}

Module["destroy"] = destroy;

function compare(obj1, obj2) {
 return obj1.ptr === obj2.ptr;
}

Module["compare"] = compare;

function getPointer(obj) {
 return obj.ptr;
}

Module["getPointer"] = getPointer;

function getClass(obj) {
 return obj.__class__;
}

Module["getClass"] = getClass;

var ensureCache = {
 buffer: 0,
 size: 0,
 pos: 0,
 temps: [],
 needed: 0,
 prepare: function() {
  if (ensureCache.needed) {
   for (var i = 0; i < ensureCache.temps.length; i++) {
    Module["_free"](ensureCache.temps[i]);
   }
   ensureCache.temps.length = 0;
   Module["_free"](ensureCache.buffer);
   ensureCache.buffer = 0;
   ensureCache.size += ensureCache.needed;
   ensureCache.needed = 0;
  }
  if (!ensureCache.buffer) {
   ensureCache.size += 128;
   ensureCache.buffer = Module["_malloc"](ensureCache.size);
   assert(ensureCache.buffer);
  }
  ensureCache.pos = 0;
 },
 alloc: function(array, view) {
  assert(ensureCache.buffer);
  var bytes = view.BYTES_PER_ELEMENT;
  var len = array.length * bytes;
  len = len + 7 & -8;
  var ret;
  if (ensureCache.pos + len >= ensureCache.size) {
   assert(len > 0);
   ensureCache.needed += len;
   ret = Module["_malloc"](len);
   ensureCache.temps.push(ret);
  } else {
   ret = ensureCache.buffer + ensureCache.pos;
   ensureCache.pos += len;
  }
  return ret;
 },
 copy: function(array, view, offset) {
  var offsetShifted = offset;
  var bytes = view.BYTES_PER_ELEMENT;
  switch (bytes) {
  case 2:
   offsetShifted >>= 1;
   break;

  case 4:
   offsetShifted >>= 2;
   break;

  case 8:
   offsetShifted >>= 3;
   break;
  }
  for (var i = 0; i < array.length; i++) {
   view[offsetShifted + i] = array[i];
  }
 }
};

function ensureString(value) {
 if (typeof value === "string") {
  var intArray = intArrayFromString(value);
  var offset = ensureCache.alloc(intArray, HEAP8);
  ensureCache.copy(intArray, HEAP8, offset);
  return offset;
 }
 return value;
}

function ensureFloat32(value) {
 if (typeof value === "object") {
  var offset = ensureCache.alloc(value, HEAPF32);
  ensureCache.copy(value, HEAPF32, offset);
  return offset;
 }
 return value;
}

function btCollisionShape() {
 throw "cannot construct a btCollisionShape, no constructor in IDL";
}

btCollisionShape.prototype = Object.create(WrapperObject.prototype);

btCollisionShape.prototype.constructor = btCollisionShape;

btCollisionShape.prototype.__class__ = btCollisionShape;

btCollisionShape.__cache__ = {};

Module["btCollisionShape"] = btCollisionShape;

btCollisionShape.prototype["setLocalScaling"] = btCollisionShape.prototype.setLocalScaling = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCollisionShape_setLocalScaling_1(self, arg0);
};

btCollisionShape.prototype["getLocalScaling"] = btCollisionShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCollisionShape_getLocalScaling_0(self), btVector3);
};

btCollisionShape.prototype["calculateLocalInertia"] = btCollisionShape.prototype.calculateLocalInertia = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btCollisionShape_calculateLocalInertia_2(self, arg0, arg1);
};

btCollisionShape.prototype["setMargin"] = btCollisionShape.prototype.setMargin = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCollisionShape_setMargin_1(self, arg0);
};

btCollisionShape.prototype["getMargin"] = btCollisionShape.prototype.getMargin = function() {
 var self = this.ptr;
 return _emscripten_bind_btCollisionShape_getMargin_0(self);
};

btCollisionShape.prototype["__destroy__"] = btCollisionShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCollisionShape___destroy___0(self);
};

function btCollisionObject() {
 throw "cannot construct a btCollisionObject, no constructor in IDL";
}

btCollisionObject.prototype = Object.create(WrapperObject.prototype);

btCollisionObject.prototype.constructor = btCollisionObject;

btCollisionObject.prototype.__class__ = btCollisionObject;

btCollisionObject.__cache__ = {};

Module["btCollisionObject"] = btCollisionObject;

btCollisionObject.prototype["setAnisotropicFriction"] = btCollisionObject.prototype.setAnisotropicFriction = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btCollisionObject_setAnisotropicFriction_2(self, arg0, arg1);
};

btCollisionObject.prototype["getCollisionShape"] = btCollisionObject.prototype.getCollisionShape = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCollisionObject_getCollisionShape_0(self), btCollisionShape);
};

btCollisionObject.prototype["setContactProcessingThreshold"] = btCollisionObject.prototype.setContactProcessingThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCollisionObject_setContactProcessingThreshold_1(self, arg0);
};

btCollisionObject.prototype["setActivationState"] = btCollisionObject.prototype.setActivationState = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCollisionObject_setActivationState_1(self, arg0);
};

btCollisionObject.prototype["forceActivationState"] = btCollisionObject.prototype.forceActivationState = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCollisionObject_forceActivationState_1(self, arg0);
};

btCollisionObject.prototype["activate"] = btCollisionObject.prototype.activate = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg0 === undefined) {
  _emscripten_bind_btCollisionObject_activate_0(self);
  return;
 }
 _emscripten_bind_btCollisionObject_activate_1(self, arg0);
};

btCollisionObject.prototype["isActive"] = btCollisionObject.prototype.isActive = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btCollisionObject_isActive_0(self);
};

btCollisionObject.prototype["isKinematicObject"] = btCollisionObject.prototype.isKinematicObject = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btCollisionObject_isKinematicObject_0(self);
};

btCollisionObject.prototype["isStaticObject"] = btCollisionObject.prototype.isStaticObject = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btCollisionObject_isStaticObject_0(self);
};

btCollisionObject.prototype["isStaticOrKinematicObject"] = btCollisionObject.prototype.isStaticOrKinematicObject = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btCollisionObject_isStaticOrKinematicObject_0(self);
};

btCollisionObject.prototype["setRestitution"] = btCollisionObject.prototype.setRestitution = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCollisionObject_setRestitution_1(self, arg0);
};

btCollisionObject.prototype["setFriction"] = btCollisionObject.prototype.setFriction = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCollisionObject_setFriction_1(self, arg0);
};

btCollisionObject.prototype["setRollingFriction"] = btCollisionObject.prototype.setRollingFriction = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCollisionObject_setRollingFriction_1(self, arg0);
};

btCollisionObject.prototype["getWorldTransform"] = btCollisionObject.prototype.getWorldTransform = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCollisionObject_getWorldTransform_0(self), btTransform);
};

btCollisionObject.prototype["getCollisionFlags"] = btCollisionObject.prototype.getCollisionFlags = function() {
 var self = this.ptr;
 return _emscripten_bind_btCollisionObject_getCollisionFlags_0(self);
};

btCollisionObject.prototype["setCollisionFlags"] = btCollisionObject.prototype.setCollisionFlags = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCollisionObject_setCollisionFlags_1(self, arg0);
};

btCollisionObject.prototype["setWorldTransform"] = btCollisionObject.prototype.setWorldTransform = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCollisionObject_setWorldTransform_1(self, arg0);
};

btCollisionObject.prototype["setCollisionShape"] = btCollisionObject.prototype.setCollisionShape = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCollisionObject_setCollisionShape_1(self, arg0);
};

btCollisionObject.prototype["setCcdMotionThreshold"] = btCollisionObject.prototype.setCcdMotionThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCollisionObject_setCcdMotionThreshold_1(self, arg0);
};

btCollisionObject.prototype["setCcdSweptSphereRadius"] = btCollisionObject.prototype.setCcdSweptSphereRadius = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCollisionObject_setCcdSweptSphereRadius_1(self, arg0);
};

btCollisionObject.prototype["getUserIndex"] = btCollisionObject.prototype.getUserIndex = function() {
 var self = this.ptr;
 return _emscripten_bind_btCollisionObject_getUserIndex_0(self);
};

btCollisionObject.prototype["setUserIndex"] = btCollisionObject.prototype.setUserIndex = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCollisionObject_setUserIndex_1(self, arg0);
};

btCollisionObject.prototype["getUserPointer"] = btCollisionObject.prototype.getUserPointer = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCollisionObject_getUserPointer_0(self), VoidPtr);
};

btCollisionObject.prototype["setUserPointer"] = btCollisionObject.prototype.setUserPointer = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCollisionObject_setUserPointer_1(self, arg0);
};

btCollisionObject.prototype["__destroy__"] = btCollisionObject.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCollisionObject___destroy___0(self);
};

function btTypedConstraint() {
 throw "cannot construct a btTypedConstraint, no constructor in IDL";
}

btTypedConstraint.prototype = Object.create(WrapperObject.prototype);

btTypedConstraint.prototype.constructor = btTypedConstraint;

btTypedConstraint.prototype.__class__ = btTypedConstraint;

btTypedConstraint.__cache__ = {};

Module["btTypedConstraint"] = btTypedConstraint;

btTypedConstraint.prototype["enableFeedback"] = btTypedConstraint.prototype.enableFeedback = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btTypedConstraint_enableFeedback_1(self, arg0);
};

btTypedConstraint.prototype["getBreakingImpulseThreshold"] = btTypedConstraint.prototype.getBreakingImpulseThreshold = function() {
 var self = this.ptr;
 return _emscripten_bind_btTypedConstraint_getBreakingImpulseThreshold_0(self);
};

btTypedConstraint.prototype["setBreakingImpulseThreshold"] = btTypedConstraint.prototype.setBreakingImpulseThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btTypedConstraint_setBreakingImpulseThreshold_1(self, arg0);
};

btTypedConstraint.prototype["getParam"] = btTypedConstraint.prototype.getParam = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 return _emscripten_bind_btTypedConstraint_getParam_2(self, arg0, arg1);
};

btTypedConstraint.prototype["setParam"] = btTypedConstraint.prototype.setParam = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 _emscripten_bind_btTypedConstraint_setParam_3(self, arg0, arg1, arg2);
};

btTypedConstraint.prototype["__destroy__"] = btTypedConstraint.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btTypedConstraint___destroy___0(self);
};

function btCollisionWorld() {
 throw "cannot construct a btCollisionWorld, no constructor in IDL";
}

btCollisionWorld.prototype = Object.create(WrapperObject.prototype);

btCollisionWorld.prototype.constructor = btCollisionWorld;

btCollisionWorld.prototype.__class__ = btCollisionWorld;

btCollisionWorld.__cache__ = {};

Module["btCollisionWorld"] = btCollisionWorld;

btCollisionWorld.prototype["getDispatcher"] = btCollisionWorld.prototype.getDispatcher = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCollisionWorld_getDispatcher_0(self), btDispatcher);
};

btCollisionWorld.prototype["rayTest"] = btCollisionWorld.prototype.rayTest = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 _emscripten_bind_btCollisionWorld_rayTest_3(self, arg0, arg1, arg2);
};

btCollisionWorld.prototype["getPairCache"] = btCollisionWorld.prototype.getPairCache = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCollisionWorld_getPairCache_0(self), btOverlappingPairCache);
};

btCollisionWorld.prototype["getDispatchInfo"] = btCollisionWorld.prototype.getDispatchInfo = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCollisionWorld_getDispatchInfo_0(self), btDispatcherInfo);
};

btCollisionWorld.prototype["addCollisionObject"] = btCollisionWorld.prototype.addCollisionObject = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg1 === undefined) {
  _emscripten_bind_btCollisionWorld_addCollisionObject_1(self, arg0);
  return;
 }
 if (arg2 === undefined) {
  _emscripten_bind_btCollisionWorld_addCollisionObject_2(self, arg0, arg1);
  return;
 }
 _emscripten_bind_btCollisionWorld_addCollisionObject_3(self, arg0, arg1, arg2);
};

btCollisionWorld.prototype["removeCollisionObject"] = btCollisionWorld.prototype.removeCollisionObject = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCollisionWorld_removeCollisionObject_1(self, arg0);
};

btCollisionWorld.prototype["getBroadphase"] = btCollisionWorld.prototype.getBroadphase = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCollisionWorld_getBroadphase_0(self), btBroadphaseInterface);
};

btCollisionWorld.prototype["convexSweepTest"] = btCollisionWorld.prototype.convexSweepTest = function(arg0, arg1, arg2, arg3, arg4) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 if (arg4 && typeof arg4 === "object") arg4 = arg4.ptr;
 _emscripten_bind_btCollisionWorld_convexSweepTest_5(self, arg0, arg1, arg2, arg3, arg4);
};

btCollisionWorld.prototype["contactPairTest"] = btCollisionWorld.prototype.contactPairTest = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 _emscripten_bind_btCollisionWorld_contactPairTest_3(self, arg0, arg1, arg2);
};

btCollisionWorld.prototype["contactTest"] = btCollisionWorld.prototype.contactTest = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btCollisionWorld_contactTest_2(self, arg0, arg1);
};

btCollisionWorld.prototype["setForceUpdateAllAabbs"] = btCollisionWorld.prototype.setForceUpdateAllAabbs = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCollisionWorld_setForceUpdateAllAabbs_1(self, arg0);
};

btCollisionWorld.prototype["updateSingleAabb"] = btCollisionWorld.prototype.updateSingleAabb = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCollisionWorld_updateSingleAabb_1(self, arg0);
};

btCollisionWorld.prototype["setDebugDrawer"] = btCollisionWorld.prototype.setDebugDrawer = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCollisionWorld_setDebugDrawer_1(self, arg0);
};

btCollisionWorld.prototype["getDebugDrawer"] = btCollisionWorld.prototype.getDebugDrawer = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCollisionWorld_getDebugDrawer_0(self), btIDebugDraw);
};

btCollisionWorld.prototype["debugDrawWorld"] = btCollisionWorld.prototype.debugDrawWorld = function() {
 var self = this.ptr;
 _emscripten_bind_btCollisionWorld_debugDrawWorld_0(self);
};

btCollisionWorld.prototype["debugDrawObject"] = btCollisionWorld.prototype.debugDrawObject = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 _emscripten_bind_btCollisionWorld_debugDrawObject_3(self, arg0, arg1, arg2);
};

btCollisionWorld.prototype["__destroy__"] = btCollisionWorld.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCollisionWorld___destroy___0(self);
};

function btConcaveShape() {
 throw "cannot construct a btConcaveShape, no constructor in IDL";
}

btConcaveShape.prototype = Object.create(btCollisionShape.prototype);

btConcaveShape.prototype.constructor = btConcaveShape;

btConcaveShape.prototype.__class__ = btConcaveShape;

btConcaveShape.__cache__ = {};

Module["btConcaveShape"] = btConcaveShape;

btConcaveShape.prototype["setLocalScaling"] = btConcaveShape.prototype.setLocalScaling = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConcaveShape_setLocalScaling_1(self, arg0);
};

btConcaveShape.prototype["getLocalScaling"] = btConcaveShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btConcaveShape_getLocalScaling_0(self), btVector3);
};

btConcaveShape.prototype["calculateLocalInertia"] = btConcaveShape.prototype.calculateLocalInertia = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btConcaveShape_calculateLocalInertia_2(self, arg0, arg1);
};

btConcaveShape.prototype["__destroy__"] = btConcaveShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btConcaveShape___destroy___0(self);
};

function btCapsuleShape(arg0, arg1) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 this.ptr = _emscripten_bind_btCapsuleShape_btCapsuleShape_2(arg0, arg1);
 getCache(btCapsuleShape)[this.ptr] = this;
}

btCapsuleShape.prototype = Object.create(btCollisionShape.prototype);

btCapsuleShape.prototype.constructor = btCapsuleShape;

btCapsuleShape.prototype.__class__ = btCapsuleShape;

btCapsuleShape.__cache__ = {};

Module["btCapsuleShape"] = btCapsuleShape;

btCapsuleShape.prototype["setMargin"] = btCapsuleShape.prototype.setMargin = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCapsuleShape_setMargin_1(self, arg0);
};

btCapsuleShape.prototype["getMargin"] = btCapsuleShape.prototype.getMargin = function() {
 var self = this.ptr;
 return _emscripten_bind_btCapsuleShape_getMargin_0(self);
};

btCapsuleShape.prototype["getUpAxis"] = btCapsuleShape.prototype.getUpAxis = function() {
 var self = this.ptr;
 return _emscripten_bind_btCapsuleShape_getUpAxis_0(self);
};

btCapsuleShape.prototype["getRadius"] = btCapsuleShape.prototype.getRadius = function() {
 var self = this.ptr;
 return _emscripten_bind_btCapsuleShape_getRadius_0(self);
};

btCapsuleShape.prototype["getHalfHeight"] = btCapsuleShape.prototype.getHalfHeight = function() {
 var self = this.ptr;
 return _emscripten_bind_btCapsuleShape_getHalfHeight_0(self);
};

btCapsuleShape.prototype["setLocalScaling"] = btCapsuleShape.prototype.setLocalScaling = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCapsuleShape_setLocalScaling_1(self, arg0);
};

btCapsuleShape.prototype["getLocalScaling"] = btCapsuleShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCapsuleShape_getLocalScaling_0(self), btVector3);
};

btCapsuleShape.prototype["calculateLocalInertia"] = btCapsuleShape.prototype.calculateLocalInertia = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btCapsuleShape_calculateLocalInertia_2(self, arg0, arg1);
};

btCapsuleShape.prototype["__destroy__"] = btCapsuleShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCapsuleShape___destroy___0(self);
};

function btIDebugDraw() {
 throw "cannot construct a btIDebugDraw, no constructor in IDL";
}

btIDebugDraw.prototype = Object.create(WrapperObject.prototype);

btIDebugDraw.prototype.constructor = btIDebugDraw;

btIDebugDraw.prototype.__class__ = btIDebugDraw;

btIDebugDraw.__cache__ = {};

Module["btIDebugDraw"] = btIDebugDraw;

btIDebugDraw.prototype["drawLine"] = btIDebugDraw.prototype.drawLine = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 _emscripten_bind_btIDebugDraw_drawLine_3(self, arg0, arg1, arg2);
};

btIDebugDraw.prototype["drawContactPoint"] = btIDebugDraw.prototype.drawContactPoint = function(arg0, arg1, arg2, arg3, arg4) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 if (arg4 && typeof arg4 === "object") arg4 = arg4.ptr;
 _emscripten_bind_btIDebugDraw_drawContactPoint_5(self, arg0, arg1, arg2, arg3, arg4);
};

btIDebugDraw.prototype["reportErrorWarning"] = btIDebugDraw.prototype.reportErrorWarning = function(arg0) {
 var self = this.ptr;
 ensureCache.prepare();
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr; else arg0 = ensureString(arg0);
 _emscripten_bind_btIDebugDraw_reportErrorWarning_1(self, arg0);
};

btIDebugDraw.prototype["draw3dText"] = btIDebugDraw.prototype.draw3dText = function(arg0, arg1) {
 var self = this.ptr;
 ensureCache.prepare();
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr; else arg1 = ensureString(arg1);
 _emscripten_bind_btIDebugDraw_draw3dText_2(self, arg0, arg1);
};

btIDebugDraw.prototype["setDebugMode"] = btIDebugDraw.prototype.setDebugMode = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btIDebugDraw_setDebugMode_1(self, arg0);
};

btIDebugDraw.prototype["getDebugMode"] = btIDebugDraw.prototype.getDebugMode = function() {
 var self = this.ptr;
 return _emscripten_bind_btIDebugDraw_getDebugMode_0(self);
};

btIDebugDraw.prototype["__destroy__"] = btIDebugDraw.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btIDebugDraw___destroy___0(self);
};

function btDynamicsWorld() {
 throw "cannot construct a btDynamicsWorld, no constructor in IDL";
}

btDynamicsWorld.prototype = Object.create(btCollisionWorld.prototype);

btDynamicsWorld.prototype.constructor = btDynamicsWorld;

btDynamicsWorld.prototype.__class__ = btDynamicsWorld;

btDynamicsWorld.__cache__ = {};

Module["btDynamicsWorld"] = btDynamicsWorld;

btDynamicsWorld.prototype["addAction"] = btDynamicsWorld.prototype.addAction = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDynamicsWorld_addAction_1(self, arg0);
};

btDynamicsWorld.prototype["removeAction"] = btDynamicsWorld.prototype.removeAction = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDynamicsWorld_removeAction_1(self, arg0);
};

btDynamicsWorld.prototype["getSolverInfo"] = btDynamicsWorld.prototype.getSolverInfo = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btDynamicsWorld_getSolverInfo_0(self), btContactSolverInfo);
};

btDynamicsWorld.prototype["getDispatcher"] = btDynamicsWorld.prototype.getDispatcher = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btDynamicsWorld_getDispatcher_0(self), btDispatcher);
};

btDynamicsWorld.prototype["rayTest"] = btDynamicsWorld.prototype.rayTest = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 _emscripten_bind_btDynamicsWorld_rayTest_3(self, arg0, arg1, arg2);
};

btDynamicsWorld.prototype["getPairCache"] = btDynamicsWorld.prototype.getPairCache = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btDynamicsWorld_getPairCache_0(self), btOverlappingPairCache);
};

btDynamicsWorld.prototype["getDispatchInfo"] = btDynamicsWorld.prototype.getDispatchInfo = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btDynamicsWorld_getDispatchInfo_0(self), btDispatcherInfo);
};

btDynamicsWorld.prototype["addCollisionObject"] = btDynamicsWorld.prototype.addCollisionObject = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg1 === undefined) {
  _emscripten_bind_btDynamicsWorld_addCollisionObject_1(self, arg0);
  return;
 }
 if (arg2 === undefined) {
  _emscripten_bind_btDynamicsWorld_addCollisionObject_2(self, arg0, arg1);
  return;
 }
 _emscripten_bind_btDynamicsWorld_addCollisionObject_3(self, arg0, arg1, arg2);
};

btDynamicsWorld.prototype["removeCollisionObject"] = btDynamicsWorld.prototype.removeCollisionObject = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDynamicsWorld_removeCollisionObject_1(self, arg0);
};

btDynamicsWorld.prototype["getBroadphase"] = btDynamicsWorld.prototype.getBroadphase = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btDynamicsWorld_getBroadphase_0(self), btBroadphaseInterface);
};

btDynamicsWorld.prototype["convexSweepTest"] = btDynamicsWorld.prototype.convexSweepTest = function(arg0, arg1, arg2, arg3, arg4) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 if (arg4 && typeof arg4 === "object") arg4 = arg4.ptr;
 _emscripten_bind_btDynamicsWorld_convexSweepTest_5(self, arg0, arg1, arg2, arg3, arg4);
};

btDynamicsWorld.prototype["contactPairTest"] = btDynamicsWorld.prototype.contactPairTest = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 _emscripten_bind_btDynamicsWorld_contactPairTest_3(self, arg0, arg1, arg2);
};

btDynamicsWorld.prototype["contactTest"] = btDynamicsWorld.prototype.contactTest = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btDynamicsWorld_contactTest_2(self, arg0, arg1);
};

btDynamicsWorld.prototype["setForceUpdateAllAabbs"] = btDynamicsWorld.prototype.setForceUpdateAllAabbs = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDynamicsWorld_setForceUpdateAllAabbs_1(self, arg0);
};

btDynamicsWorld.prototype["updateSingleAabb"] = btDynamicsWorld.prototype.updateSingleAabb = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDynamicsWorld_updateSingleAabb_1(self, arg0);
};

btDynamicsWorld.prototype["setDebugDrawer"] = btDynamicsWorld.prototype.setDebugDrawer = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDynamicsWorld_setDebugDrawer_1(self, arg0);
};

btDynamicsWorld.prototype["getDebugDrawer"] = btDynamicsWorld.prototype.getDebugDrawer = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btDynamicsWorld_getDebugDrawer_0(self), btIDebugDraw);
};

btDynamicsWorld.prototype["debugDrawWorld"] = btDynamicsWorld.prototype.debugDrawWorld = function() {
 var self = this.ptr;
 _emscripten_bind_btDynamicsWorld_debugDrawWorld_0(self);
};

btDynamicsWorld.prototype["debugDrawObject"] = btDynamicsWorld.prototype.debugDrawObject = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 _emscripten_bind_btDynamicsWorld_debugDrawObject_3(self, arg0, arg1, arg2);
};

btDynamicsWorld.prototype["__destroy__"] = btDynamicsWorld.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btDynamicsWorld___destroy___0(self);
};

function ConvexResultCallback() {
 throw "cannot construct a ConvexResultCallback, no constructor in IDL";
}

ConvexResultCallback.prototype = Object.create(WrapperObject.prototype);

ConvexResultCallback.prototype.constructor = ConvexResultCallback;

ConvexResultCallback.prototype.__class__ = ConvexResultCallback;

ConvexResultCallback.__cache__ = {};

Module["ConvexResultCallback"] = ConvexResultCallback;

ConvexResultCallback.prototype["hasHit"] = ConvexResultCallback.prototype.hasHit = function() {
 var self = this.ptr;
 return !!_emscripten_bind_ConvexResultCallback_hasHit_0(self);
};

ConvexResultCallback.prototype["get_m_collisionFilterGroup"] = ConvexResultCallback.prototype.get_m_collisionFilterGroup = function() {
 var self = this.ptr;
 return _emscripten_bind_ConvexResultCallback_get_m_collisionFilterGroup_0(self);
};

ConvexResultCallback.prototype["set_m_collisionFilterGroup"] = ConvexResultCallback.prototype.set_m_collisionFilterGroup = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_ConvexResultCallback_set_m_collisionFilterGroup_1(self, arg0);
};

Object.defineProperty(ConvexResultCallback.prototype, "m_collisionFilterGroup", {
 get: ConvexResultCallback.prototype.get_m_collisionFilterGroup,
 set: ConvexResultCallback.prototype.set_m_collisionFilterGroup
});

ConvexResultCallback.prototype["get_m_collisionFilterMask"] = ConvexResultCallback.prototype.get_m_collisionFilterMask = function() {
 var self = this.ptr;
 return _emscripten_bind_ConvexResultCallback_get_m_collisionFilterMask_0(self);
};

ConvexResultCallback.prototype["set_m_collisionFilterMask"] = ConvexResultCallback.prototype.set_m_collisionFilterMask = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_ConvexResultCallback_set_m_collisionFilterMask_1(self, arg0);
};

Object.defineProperty(ConvexResultCallback.prototype, "m_collisionFilterMask", {
 get: ConvexResultCallback.prototype.get_m_collisionFilterMask,
 set: ConvexResultCallback.prototype.set_m_collisionFilterMask
});

ConvexResultCallback.prototype["get_m_closestHitFraction"] = ConvexResultCallback.prototype.get_m_closestHitFraction = function() {
 var self = this.ptr;
 return _emscripten_bind_ConvexResultCallback_get_m_closestHitFraction_0(self);
};

ConvexResultCallback.prototype["set_m_closestHitFraction"] = ConvexResultCallback.prototype.set_m_closestHitFraction = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_ConvexResultCallback_set_m_closestHitFraction_1(self, arg0);
};

Object.defineProperty(ConvexResultCallback.prototype, "m_closestHitFraction", {
 get: ConvexResultCallback.prototype.get_m_closestHitFraction,
 set: ConvexResultCallback.prototype.set_m_closestHitFraction
});

ConvexResultCallback.prototype["__destroy__"] = ConvexResultCallback.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_ConvexResultCallback___destroy___0(self);
};

function btTriangleMeshShape() {
 throw "cannot construct a btTriangleMeshShape, no constructor in IDL";
}

btTriangleMeshShape.prototype = Object.create(btConcaveShape.prototype);

btTriangleMeshShape.prototype.constructor = btTriangleMeshShape;

btTriangleMeshShape.prototype.__class__ = btTriangleMeshShape;

btTriangleMeshShape.__cache__ = {};

Module["btTriangleMeshShape"] = btTriangleMeshShape;

btTriangleMeshShape.prototype["setLocalScaling"] = btTriangleMeshShape.prototype.setLocalScaling = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btTriangleMeshShape_setLocalScaling_1(self, arg0);
};

btTriangleMeshShape.prototype["getLocalScaling"] = btTriangleMeshShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btTriangleMeshShape_getLocalScaling_0(self), btVector3);
};

btTriangleMeshShape.prototype["calculateLocalInertia"] = btTriangleMeshShape.prototype.calculateLocalInertia = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btTriangleMeshShape_calculateLocalInertia_2(self, arg0, arg1);
};

btTriangleMeshShape.prototype["__destroy__"] = btTriangleMeshShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btTriangleMeshShape___destroy___0(self);
};

function btGhostObject() {
 this.ptr = _emscripten_bind_btGhostObject_btGhostObject_0();
 getCache(btGhostObject)[this.ptr] = this;
}

btGhostObject.prototype = Object.create(btCollisionObject.prototype);

btGhostObject.prototype.constructor = btGhostObject;

btGhostObject.prototype.__class__ = btGhostObject;

btGhostObject.__cache__ = {};

Module["btGhostObject"] = btGhostObject;

btGhostObject.prototype["getNumOverlappingObjects"] = btGhostObject.prototype.getNumOverlappingObjects = function() {
 var self = this.ptr;
 return _emscripten_bind_btGhostObject_getNumOverlappingObjects_0(self);
};

btGhostObject.prototype["getOverlappingObject"] = btGhostObject.prototype.getOverlappingObject = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return wrapPointer(_emscripten_bind_btGhostObject_getOverlappingObject_1(self, arg0), btCollisionObject);
};

btGhostObject.prototype["setAnisotropicFriction"] = btGhostObject.prototype.setAnisotropicFriction = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btGhostObject_setAnisotropicFriction_2(self, arg0, arg1);
};

btGhostObject.prototype["getCollisionShape"] = btGhostObject.prototype.getCollisionShape = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btGhostObject_getCollisionShape_0(self), btCollisionShape);
};

btGhostObject.prototype["setContactProcessingThreshold"] = btGhostObject.prototype.setContactProcessingThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGhostObject_setContactProcessingThreshold_1(self, arg0);
};

btGhostObject.prototype["setActivationState"] = btGhostObject.prototype.setActivationState = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGhostObject_setActivationState_1(self, arg0);
};

btGhostObject.prototype["forceActivationState"] = btGhostObject.prototype.forceActivationState = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGhostObject_forceActivationState_1(self, arg0);
};

btGhostObject.prototype["activate"] = btGhostObject.prototype.activate = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg0 === undefined) {
  _emscripten_bind_btGhostObject_activate_0(self);
  return;
 }
 _emscripten_bind_btGhostObject_activate_1(self, arg0);
};

btGhostObject.prototype["isActive"] = btGhostObject.prototype.isActive = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btGhostObject_isActive_0(self);
};

btGhostObject.prototype["isKinematicObject"] = btGhostObject.prototype.isKinematicObject = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btGhostObject_isKinematicObject_0(self);
};

btGhostObject.prototype["isStaticObject"] = btGhostObject.prototype.isStaticObject = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btGhostObject_isStaticObject_0(self);
};

btGhostObject.prototype["isStaticOrKinematicObject"] = btGhostObject.prototype.isStaticOrKinematicObject = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btGhostObject_isStaticOrKinematicObject_0(self);
};

btGhostObject.prototype["setRestitution"] = btGhostObject.prototype.setRestitution = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGhostObject_setRestitution_1(self, arg0);
};

btGhostObject.prototype["setFriction"] = btGhostObject.prototype.setFriction = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGhostObject_setFriction_1(self, arg0);
};

btGhostObject.prototype["setRollingFriction"] = btGhostObject.prototype.setRollingFriction = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGhostObject_setRollingFriction_1(self, arg0);
};

btGhostObject.prototype["getWorldTransform"] = btGhostObject.prototype.getWorldTransform = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btGhostObject_getWorldTransform_0(self), btTransform);
};

btGhostObject.prototype["getCollisionFlags"] = btGhostObject.prototype.getCollisionFlags = function() {
 var self = this.ptr;
 return _emscripten_bind_btGhostObject_getCollisionFlags_0(self);
};

btGhostObject.prototype["setCollisionFlags"] = btGhostObject.prototype.setCollisionFlags = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGhostObject_setCollisionFlags_1(self, arg0);
};

btGhostObject.prototype["setWorldTransform"] = btGhostObject.prototype.setWorldTransform = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGhostObject_setWorldTransform_1(self, arg0);
};

btGhostObject.prototype["setCollisionShape"] = btGhostObject.prototype.setCollisionShape = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGhostObject_setCollisionShape_1(self, arg0);
};

btGhostObject.prototype["setCcdMotionThreshold"] = btGhostObject.prototype.setCcdMotionThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGhostObject_setCcdMotionThreshold_1(self, arg0);
};

btGhostObject.prototype["setCcdSweptSphereRadius"] = btGhostObject.prototype.setCcdSweptSphereRadius = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGhostObject_setCcdSweptSphereRadius_1(self, arg0);
};

btGhostObject.prototype["getUserIndex"] = btGhostObject.prototype.getUserIndex = function() {
 var self = this.ptr;
 return _emscripten_bind_btGhostObject_getUserIndex_0(self);
};

btGhostObject.prototype["setUserIndex"] = btGhostObject.prototype.setUserIndex = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGhostObject_setUserIndex_1(self, arg0);
};

btGhostObject.prototype["getUserPointer"] = btGhostObject.prototype.getUserPointer = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btGhostObject_getUserPointer_0(self), VoidPtr);
};

btGhostObject.prototype["setUserPointer"] = btGhostObject.prototype.setUserPointer = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGhostObject_setUserPointer_1(self, arg0);
};

btGhostObject.prototype["__destroy__"] = btGhostObject.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btGhostObject___destroy___0(self);
};

function btConeShape(arg0, arg1) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 this.ptr = _emscripten_bind_btConeShape_btConeShape_2(arg0, arg1);
 getCache(btConeShape)[this.ptr] = this;
}

btConeShape.prototype = Object.create(btCollisionShape.prototype);

btConeShape.prototype.constructor = btConeShape;

btConeShape.prototype.__class__ = btConeShape;

btConeShape.__cache__ = {};

Module["btConeShape"] = btConeShape;

btConeShape.prototype["setLocalScaling"] = btConeShape.prototype.setLocalScaling = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConeShape_setLocalScaling_1(self, arg0);
};

btConeShape.prototype["getLocalScaling"] = btConeShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btConeShape_getLocalScaling_0(self), btVector3);
};

btConeShape.prototype["calculateLocalInertia"] = btConeShape.prototype.calculateLocalInertia = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btConeShape_calculateLocalInertia_2(self, arg0, arg1);
};

btConeShape.prototype["__destroy__"] = btConeShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btConeShape___destroy___0(self);
};

function btActionInterface() {
 throw "cannot construct a btActionInterface, no constructor in IDL";
}

btActionInterface.prototype = Object.create(WrapperObject.prototype);

btActionInterface.prototype.constructor = btActionInterface;

btActionInterface.prototype.__class__ = btActionInterface;

btActionInterface.__cache__ = {};

Module["btActionInterface"] = btActionInterface;

btActionInterface.prototype["updateAction"] = btActionInterface.prototype.updateAction = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btActionInterface_updateAction_2(self, arg0, arg1);
};

btActionInterface.prototype["__destroy__"] = btActionInterface.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btActionInterface___destroy___0(self);
};

function btVector3(arg0, arg1, arg2) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg0 === undefined) {
  this.ptr = _emscripten_bind_btVector3_btVector3_0();
  getCache(btVector3)[this.ptr] = this;
  return;
 }
 if (arg1 === undefined) {
  this.ptr = _emscripten_bind_btVector3_btVector3_1(arg0);
  getCache(btVector3)[this.ptr] = this;
  return;
 }
 if (arg2 === undefined) {
  this.ptr = _emscripten_bind_btVector3_btVector3_2(arg0, arg1);
  getCache(btVector3)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btVector3_btVector3_3(arg0, arg1, arg2);
 getCache(btVector3)[this.ptr] = this;
}

btVector3.prototype = Object.create(WrapperObject.prototype);

btVector3.prototype.constructor = btVector3;

btVector3.prototype.__class__ = btVector3;

btVector3.__cache__ = {};

Module["btVector3"] = btVector3;

btVector3.prototype["length"] = btVector3.prototype.length = function() {
 var self = this.ptr;
 return _emscripten_bind_btVector3_length_0(self);
};

btVector3.prototype["x"] = btVector3.prototype.x = function() {
 var self = this.ptr;
 return _emscripten_bind_btVector3_x_0(self);
};

btVector3.prototype["y"] = btVector3.prototype.y = function() {
 var self = this.ptr;
 return _emscripten_bind_btVector3_y_0(self);
};

btVector3.prototype["z"] = btVector3.prototype.z = function() {
 var self = this.ptr;
 return _emscripten_bind_btVector3_z_0(self);
};

btVector3.prototype["setX"] = btVector3.prototype.setX = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btVector3_setX_1(self, arg0);
};

btVector3.prototype["setY"] = btVector3.prototype.setY = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btVector3_setY_1(self, arg0);
};

btVector3.prototype["setZ"] = btVector3.prototype.setZ = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btVector3_setZ_1(self, arg0);
};

btVector3.prototype["setValue"] = btVector3.prototype.setValue = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 _emscripten_bind_btVector3_setValue_3(self, arg0, arg1, arg2);
};

btVector3.prototype["normalize"] = btVector3.prototype.normalize = function() {
 var self = this.ptr;
 _emscripten_bind_btVector3_normalize_0(self);
};

btVector3.prototype["rotate"] = btVector3.prototype.rotate = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 return wrapPointer(_emscripten_bind_btVector3_rotate_2(self, arg0, arg1), btVector3);
};

btVector3.prototype["dot"] = btVector3.prototype.dot = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return _emscripten_bind_btVector3_dot_1(self, arg0);
};

btVector3.prototype["op_mul"] = btVector3.prototype.op_mul = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return wrapPointer(_emscripten_bind_btVector3_op_mul_1(self, arg0), btVector3);
};

btVector3.prototype["op_add"] = btVector3.prototype.op_add = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return wrapPointer(_emscripten_bind_btVector3_op_add_1(self, arg0), btVector3);
};

btVector3.prototype["op_sub"] = btVector3.prototype.op_sub = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return wrapPointer(_emscripten_bind_btVector3_op_sub_1(self, arg0), btVector3);
};

btVector3.prototype["__destroy__"] = btVector3.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btVector3___destroy___0(self);
};

function btQuadWord() {
 throw "cannot construct a btQuadWord, no constructor in IDL";
}

btQuadWord.prototype = Object.create(WrapperObject.prototype);

btQuadWord.prototype.constructor = btQuadWord;

btQuadWord.prototype.__class__ = btQuadWord;

btQuadWord.__cache__ = {};

Module["btQuadWord"] = btQuadWord;

btQuadWord.prototype["x"] = btQuadWord.prototype.x = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuadWord_x_0(self);
};

btQuadWord.prototype["y"] = btQuadWord.prototype.y = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuadWord_y_0(self);
};

btQuadWord.prototype["z"] = btQuadWord.prototype.z = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuadWord_z_0(self);
};

btQuadWord.prototype["w"] = btQuadWord.prototype.w = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuadWord_w_0(self);
};

btQuadWord.prototype["setX"] = btQuadWord.prototype.setX = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btQuadWord_setX_1(self, arg0);
};

btQuadWord.prototype["setY"] = btQuadWord.prototype.setY = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btQuadWord_setY_1(self, arg0);
};

btQuadWord.prototype["setZ"] = btQuadWord.prototype.setZ = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btQuadWord_setZ_1(self, arg0);
};

btQuadWord.prototype["setW"] = btQuadWord.prototype.setW = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btQuadWord_setW_1(self, arg0);
};

btQuadWord.prototype["__destroy__"] = btQuadWord.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btQuadWord___destroy___0(self);
};

function btCylinderShape(arg0) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 this.ptr = _emscripten_bind_btCylinderShape_btCylinderShape_1(arg0);
 getCache(btCylinderShape)[this.ptr] = this;
}

btCylinderShape.prototype = Object.create(btCollisionShape.prototype);

btCylinderShape.prototype.constructor = btCylinderShape;

btCylinderShape.prototype.__class__ = btCylinderShape;

btCylinderShape.__cache__ = {};

Module["btCylinderShape"] = btCylinderShape;

btCylinderShape.prototype["setMargin"] = btCylinderShape.prototype.setMargin = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCylinderShape_setMargin_1(self, arg0);
};

btCylinderShape.prototype["getMargin"] = btCylinderShape.prototype.getMargin = function() {
 var self = this.ptr;
 return _emscripten_bind_btCylinderShape_getMargin_0(self);
};

btCylinderShape.prototype["setLocalScaling"] = btCylinderShape.prototype.setLocalScaling = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCylinderShape_setLocalScaling_1(self, arg0);
};

btCylinderShape.prototype["getLocalScaling"] = btCylinderShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCylinderShape_getLocalScaling_0(self), btVector3);
};

btCylinderShape.prototype["calculateLocalInertia"] = btCylinderShape.prototype.calculateLocalInertia = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btCylinderShape_calculateLocalInertia_2(self, arg0, arg1);
};

btCylinderShape.prototype["__destroy__"] = btCylinderShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCylinderShape___destroy___0(self);
};

function btConvexShape() {
 throw "cannot construct a btConvexShape, no constructor in IDL";
}

btConvexShape.prototype = Object.create(btCollisionShape.prototype);

btConvexShape.prototype.constructor = btConvexShape;

btConvexShape.prototype.__class__ = btConvexShape;

btConvexShape.__cache__ = {};

Module["btConvexShape"] = btConvexShape;

btConvexShape.prototype["setLocalScaling"] = btConvexShape.prototype.setLocalScaling = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConvexShape_setLocalScaling_1(self, arg0);
};

btConvexShape.prototype["getLocalScaling"] = btConvexShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btConvexShape_getLocalScaling_0(self), btVector3);
};

btConvexShape.prototype["calculateLocalInertia"] = btConvexShape.prototype.calculateLocalInertia = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btConvexShape_calculateLocalInertia_2(self, arg0, arg1);
};

btConvexShape.prototype["setMargin"] = btConvexShape.prototype.setMargin = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConvexShape_setMargin_1(self, arg0);
};

btConvexShape.prototype["getMargin"] = btConvexShape.prototype.getMargin = function() {
 var self = this.ptr;
 return _emscripten_bind_btConvexShape_getMargin_0(self);
};

btConvexShape.prototype["__destroy__"] = btConvexShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btConvexShape___destroy___0(self);
};

function btDispatcher() {
 throw "cannot construct a btDispatcher, no constructor in IDL";
}

btDispatcher.prototype = Object.create(WrapperObject.prototype);

btDispatcher.prototype.constructor = btDispatcher;

btDispatcher.prototype.__class__ = btDispatcher;

btDispatcher.__cache__ = {};

Module["btDispatcher"] = btDispatcher;

btDispatcher.prototype["getNumManifolds"] = btDispatcher.prototype.getNumManifolds = function() {
 var self = this.ptr;
 return _emscripten_bind_btDispatcher_getNumManifolds_0(self);
};

btDispatcher.prototype["getManifoldByIndexInternal"] = btDispatcher.prototype.getManifoldByIndexInternal = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return wrapPointer(_emscripten_bind_btDispatcher_getManifoldByIndexInternal_1(self, arg0), btPersistentManifold);
};

btDispatcher.prototype["__destroy__"] = btDispatcher.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btDispatcher___destroy___0(self);
};

function btGeneric6DofConstraint(arg0, arg1, arg2, arg3, arg4) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 if (arg4 && typeof arg4 === "object") arg4 = arg4.ptr;
 if (arg3 === undefined) {
  this.ptr = _emscripten_bind_btGeneric6DofConstraint_btGeneric6DofConstraint_3(arg0, arg1, arg2);
  getCache(btGeneric6DofConstraint)[this.ptr] = this;
  return;
 }
 if (arg4 === undefined) {
  this.ptr = _emscripten_bind_btGeneric6DofConstraint_btGeneric6DofConstraint_4(arg0, arg1, arg2, arg3);
  getCache(btGeneric6DofConstraint)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btGeneric6DofConstraint_btGeneric6DofConstraint_5(arg0, arg1, arg2, arg3, arg4);
 getCache(btGeneric6DofConstraint)[this.ptr] = this;
}

btGeneric6DofConstraint.prototype = Object.create(btTypedConstraint.prototype);

btGeneric6DofConstraint.prototype.constructor = btGeneric6DofConstraint;

btGeneric6DofConstraint.prototype.__class__ = btGeneric6DofConstraint;

btGeneric6DofConstraint.__cache__ = {};

Module["btGeneric6DofConstraint"] = btGeneric6DofConstraint;

btGeneric6DofConstraint.prototype["setLinearLowerLimit"] = btGeneric6DofConstraint.prototype.setLinearLowerLimit = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGeneric6DofConstraint_setLinearLowerLimit_1(self, arg0);
};

btGeneric6DofConstraint.prototype["setLinearUpperLimit"] = btGeneric6DofConstraint.prototype.setLinearUpperLimit = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGeneric6DofConstraint_setLinearUpperLimit_1(self, arg0);
};

btGeneric6DofConstraint.prototype["setAngularLowerLimit"] = btGeneric6DofConstraint.prototype.setAngularLowerLimit = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGeneric6DofConstraint_setAngularLowerLimit_1(self, arg0);
};

btGeneric6DofConstraint.prototype["setAngularUpperLimit"] = btGeneric6DofConstraint.prototype.setAngularUpperLimit = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGeneric6DofConstraint_setAngularUpperLimit_1(self, arg0);
};

btGeneric6DofConstraint.prototype["getFrameOffsetA"] = btGeneric6DofConstraint.prototype.getFrameOffsetA = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btGeneric6DofConstraint_getFrameOffsetA_0(self), btTransform);
};

btGeneric6DofConstraint.prototype["enableFeedback"] = btGeneric6DofConstraint.prototype.enableFeedback = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGeneric6DofConstraint_enableFeedback_1(self, arg0);
};

btGeneric6DofConstraint.prototype["getBreakingImpulseThreshold"] = btGeneric6DofConstraint.prototype.getBreakingImpulseThreshold = function() {
 var self = this.ptr;
 return _emscripten_bind_btGeneric6DofConstraint_getBreakingImpulseThreshold_0(self);
};

btGeneric6DofConstraint.prototype["setBreakingImpulseThreshold"] = btGeneric6DofConstraint.prototype.setBreakingImpulseThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGeneric6DofConstraint_setBreakingImpulseThreshold_1(self, arg0);
};

btGeneric6DofConstraint.prototype["getParam"] = btGeneric6DofConstraint.prototype.getParam = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 return _emscripten_bind_btGeneric6DofConstraint_getParam_2(self, arg0, arg1);
};

btGeneric6DofConstraint.prototype["setParam"] = btGeneric6DofConstraint.prototype.setParam = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 _emscripten_bind_btGeneric6DofConstraint_setParam_3(self, arg0, arg1, arg2);
};

btGeneric6DofConstraint.prototype["__destroy__"] = btGeneric6DofConstraint.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btGeneric6DofConstraint___destroy___0(self);
};

function btStridingMeshInterface() {
 throw "cannot construct a btStridingMeshInterface, no constructor in IDL";
}

btStridingMeshInterface.prototype = Object.create(WrapperObject.prototype);

btStridingMeshInterface.prototype.constructor = btStridingMeshInterface;

btStridingMeshInterface.prototype.__class__ = btStridingMeshInterface;

btStridingMeshInterface.__cache__ = {};

Module["btStridingMeshInterface"] = btStridingMeshInterface;

btStridingMeshInterface.prototype["setScaling"] = btStridingMeshInterface.prototype.setScaling = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btStridingMeshInterface_setScaling_1(self, arg0);
};

btStridingMeshInterface.prototype["__destroy__"] = btStridingMeshInterface.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btStridingMeshInterface___destroy___0(self);
};

function btMotionState() {
 throw "cannot construct a btMotionState, no constructor in IDL";
}

btMotionState.prototype = Object.create(WrapperObject.prototype);

btMotionState.prototype.constructor = btMotionState;

btMotionState.prototype.__class__ = btMotionState;

btMotionState.__cache__ = {};

Module["btMotionState"] = btMotionState;

btMotionState.prototype["getWorldTransform"] = btMotionState.prototype.getWorldTransform = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btMotionState_getWorldTransform_1(self, arg0);
};

btMotionState.prototype["setWorldTransform"] = btMotionState.prototype.setWorldTransform = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btMotionState_setWorldTransform_1(self, arg0);
};

btMotionState.prototype["__destroy__"] = btMotionState.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btMotionState___destroy___0(self);
};

function ContactResultCallback() {
 throw "cannot construct a ContactResultCallback, no constructor in IDL";
}

ContactResultCallback.prototype = Object.create(WrapperObject.prototype);

ContactResultCallback.prototype.constructor = ContactResultCallback;

ContactResultCallback.prototype.__class__ = ContactResultCallback;

ContactResultCallback.__cache__ = {};

Module["ContactResultCallback"] = ContactResultCallback;

ContactResultCallback.prototype["addSingleResult"] = ContactResultCallback.prototype.addSingleResult = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 if (arg4 && typeof arg4 === "object") arg4 = arg4.ptr;
 if (arg5 && typeof arg5 === "object") arg5 = arg5.ptr;
 if (arg6 && typeof arg6 === "object") arg6 = arg6.ptr;
 return _emscripten_bind_ContactResultCallback_addSingleResult_7(self, arg0, arg1, arg2, arg3, arg4, arg5, arg6);
};

ContactResultCallback.prototype["__destroy__"] = ContactResultCallback.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_ContactResultCallback___destroy___0(self);
};

function RayResultCallback() {
 throw "cannot construct a RayResultCallback, no constructor in IDL";
}

RayResultCallback.prototype = Object.create(WrapperObject.prototype);

RayResultCallback.prototype.constructor = RayResultCallback;

RayResultCallback.prototype.__class__ = RayResultCallback;

RayResultCallback.__cache__ = {};

Module["RayResultCallback"] = RayResultCallback;

RayResultCallback.prototype["hasHit"] = RayResultCallback.prototype.hasHit = function() {
 var self = this.ptr;
 return !!_emscripten_bind_RayResultCallback_hasHit_0(self);
};

RayResultCallback.prototype["get_m_collisionFilterGroup"] = RayResultCallback.prototype.get_m_collisionFilterGroup = function() {
 var self = this.ptr;
 return _emscripten_bind_RayResultCallback_get_m_collisionFilterGroup_0(self);
};

RayResultCallback.prototype["set_m_collisionFilterGroup"] = RayResultCallback.prototype.set_m_collisionFilterGroup = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_RayResultCallback_set_m_collisionFilterGroup_1(self, arg0);
};

Object.defineProperty(RayResultCallback.prototype, "m_collisionFilterGroup", {
 get: RayResultCallback.prototype.get_m_collisionFilterGroup,
 set: RayResultCallback.prototype.set_m_collisionFilterGroup
});

RayResultCallback.prototype["get_m_collisionFilterMask"] = RayResultCallback.prototype.get_m_collisionFilterMask = function() {
 var self = this.ptr;
 return _emscripten_bind_RayResultCallback_get_m_collisionFilterMask_0(self);
};

RayResultCallback.prototype["set_m_collisionFilterMask"] = RayResultCallback.prototype.set_m_collisionFilterMask = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_RayResultCallback_set_m_collisionFilterMask_1(self, arg0);
};

Object.defineProperty(RayResultCallback.prototype, "m_collisionFilterMask", {
 get: RayResultCallback.prototype.get_m_collisionFilterMask,
 set: RayResultCallback.prototype.set_m_collisionFilterMask
});

RayResultCallback.prototype["get_m_closestHitFraction"] = RayResultCallback.prototype.get_m_closestHitFraction = function() {
 var self = this.ptr;
 return _emscripten_bind_RayResultCallback_get_m_closestHitFraction_0(self);
};

RayResultCallback.prototype["set_m_closestHitFraction"] = RayResultCallback.prototype.set_m_closestHitFraction = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_RayResultCallback_set_m_closestHitFraction_1(self, arg0);
};

Object.defineProperty(RayResultCallback.prototype, "m_closestHitFraction", {
 get: RayResultCallback.prototype.get_m_closestHitFraction,
 set: RayResultCallback.prototype.set_m_closestHitFraction
});

RayResultCallback.prototype["get_m_collisionObject"] = RayResultCallback.prototype.get_m_collisionObject = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_RayResultCallback_get_m_collisionObject_0(self), btCollisionObject);
};

RayResultCallback.prototype["set_m_collisionObject"] = RayResultCallback.prototype.set_m_collisionObject = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_RayResultCallback_set_m_collisionObject_1(self, arg0);
};

Object.defineProperty(RayResultCallback.prototype, "m_collisionObject", {
 get: RayResultCallback.prototype.get_m_collisionObject,
 set: RayResultCallback.prototype.set_m_collisionObject
});

RayResultCallback.prototype["__destroy__"] = RayResultCallback.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_RayResultCallback___destroy___0(self);
};

function btMatrix3x3() {
 throw "cannot construct a btMatrix3x3, no constructor in IDL";
}

btMatrix3x3.prototype = Object.create(WrapperObject.prototype);

btMatrix3x3.prototype.constructor = btMatrix3x3;

btMatrix3x3.prototype.__class__ = btMatrix3x3;

btMatrix3x3.__cache__ = {};

Module["btMatrix3x3"] = btMatrix3x3;

btMatrix3x3.prototype["setEulerZYX"] = btMatrix3x3.prototype.setEulerZYX = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 _emscripten_bind_btMatrix3x3_setEulerZYX_3(self, arg0, arg1, arg2);
};

btMatrix3x3.prototype["getRotation"] = btMatrix3x3.prototype.getRotation = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btMatrix3x3_getRotation_1(self, arg0);
};

btMatrix3x3.prototype["getRow"] = btMatrix3x3.prototype.getRow = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return wrapPointer(_emscripten_bind_btMatrix3x3_getRow_1(self, arg0), btVector3);
};

btMatrix3x3.prototype["__destroy__"] = btMatrix3x3.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btMatrix3x3___destroy___0(self);
};

function btDispatcherInfo() {
 throw "cannot construct a btDispatcherInfo, no constructor in IDL";
}

btDispatcherInfo.prototype = Object.create(WrapperObject.prototype);

btDispatcherInfo.prototype.constructor = btDispatcherInfo;

btDispatcherInfo.prototype.__class__ = btDispatcherInfo;

btDispatcherInfo.__cache__ = {};

Module["btDispatcherInfo"] = btDispatcherInfo;

btDispatcherInfo.prototype["get_m_timeStep"] = btDispatcherInfo.prototype.get_m_timeStep = function() {
 var self = this.ptr;
 return _emscripten_bind_btDispatcherInfo_get_m_timeStep_0(self);
};

btDispatcherInfo.prototype["set_m_timeStep"] = btDispatcherInfo.prototype.set_m_timeStep = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDispatcherInfo_set_m_timeStep_1(self, arg0);
};

Object.defineProperty(btDispatcherInfo.prototype, "m_timeStep", {
 get: btDispatcherInfo.prototype.get_m_timeStep,
 set: btDispatcherInfo.prototype.set_m_timeStep
});

btDispatcherInfo.prototype["get_m_stepCount"] = btDispatcherInfo.prototype.get_m_stepCount = function() {
 var self = this.ptr;
 return _emscripten_bind_btDispatcherInfo_get_m_stepCount_0(self);
};

btDispatcherInfo.prototype["set_m_stepCount"] = btDispatcherInfo.prototype.set_m_stepCount = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDispatcherInfo_set_m_stepCount_1(self, arg0);
};

Object.defineProperty(btDispatcherInfo.prototype, "m_stepCount", {
 get: btDispatcherInfo.prototype.get_m_stepCount,
 set: btDispatcherInfo.prototype.set_m_stepCount
});

btDispatcherInfo.prototype["get_m_dispatchFunc"] = btDispatcherInfo.prototype.get_m_dispatchFunc = function() {
 var self = this.ptr;
 return _emscripten_bind_btDispatcherInfo_get_m_dispatchFunc_0(self);
};

btDispatcherInfo.prototype["set_m_dispatchFunc"] = btDispatcherInfo.prototype.set_m_dispatchFunc = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDispatcherInfo_set_m_dispatchFunc_1(self, arg0);
};

Object.defineProperty(btDispatcherInfo.prototype, "m_dispatchFunc", {
 get: btDispatcherInfo.prototype.get_m_dispatchFunc,
 set: btDispatcherInfo.prototype.set_m_dispatchFunc
});

btDispatcherInfo.prototype["get_m_timeOfImpact"] = btDispatcherInfo.prototype.get_m_timeOfImpact = function() {
 var self = this.ptr;
 return _emscripten_bind_btDispatcherInfo_get_m_timeOfImpact_0(self);
};

btDispatcherInfo.prototype["set_m_timeOfImpact"] = btDispatcherInfo.prototype.set_m_timeOfImpact = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDispatcherInfo_set_m_timeOfImpact_1(self, arg0);
};

Object.defineProperty(btDispatcherInfo.prototype, "m_timeOfImpact", {
 get: btDispatcherInfo.prototype.get_m_timeOfImpact,
 set: btDispatcherInfo.prototype.set_m_timeOfImpact
});

btDispatcherInfo.prototype["get_m_useContinuous"] = btDispatcherInfo.prototype.get_m_useContinuous = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btDispatcherInfo_get_m_useContinuous_0(self);
};

btDispatcherInfo.prototype["set_m_useContinuous"] = btDispatcherInfo.prototype.set_m_useContinuous = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDispatcherInfo_set_m_useContinuous_1(self, arg0);
};

Object.defineProperty(btDispatcherInfo.prototype, "m_useContinuous", {
 get: btDispatcherInfo.prototype.get_m_useContinuous,
 set: btDispatcherInfo.prototype.set_m_useContinuous
});

btDispatcherInfo.prototype["get_m_enableSatConvex"] = btDispatcherInfo.prototype.get_m_enableSatConvex = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btDispatcherInfo_get_m_enableSatConvex_0(self);
};

btDispatcherInfo.prototype["set_m_enableSatConvex"] = btDispatcherInfo.prototype.set_m_enableSatConvex = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDispatcherInfo_set_m_enableSatConvex_1(self, arg0);
};

Object.defineProperty(btDispatcherInfo.prototype, "m_enableSatConvex", {
 get: btDispatcherInfo.prototype.get_m_enableSatConvex,
 set: btDispatcherInfo.prototype.set_m_enableSatConvex
});

btDispatcherInfo.prototype["get_m_enableSPU"] = btDispatcherInfo.prototype.get_m_enableSPU = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btDispatcherInfo_get_m_enableSPU_0(self);
};

btDispatcherInfo.prototype["set_m_enableSPU"] = btDispatcherInfo.prototype.set_m_enableSPU = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDispatcherInfo_set_m_enableSPU_1(self, arg0);
};

Object.defineProperty(btDispatcherInfo.prototype, "m_enableSPU", {
 get: btDispatcherInfo.prototype.get_m_enableSPU,
 set: btDispatcherInfo.prototype.set_m_enableSPU
});

btDispatcherInfo.prototype["get_m_useEpa"] = btDispatcherInfo.prototype.get_m_useEpa = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btDispatcherInfo_get_m_useEpa_0(self);
};

btDispatcherInfo.prototype["set_m_useEpa"] = btDispatcherInfo.prototype.set_m_useEpa = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDispatcherInfo_set_m_useEpa_1(self, arg0);
};

Object.defineProperty(btDispatcherInfo.prototype, "m_useEpa", {
 get: btDispatcherInfo.prototype.get_m_useEpa,
 set: btDispatcherInfo.prototype.set_m_useEpa
});

btDispatcherInfo.prototype["get_m_allowedCcdPenetration"] = btDispatcherInfo.prototype.get_m_allowedCcdPenetration = function() {
 var self = this.ptr;
 return _emscripten_bind_btDispatcherInfo_get_m_allowedCcdPenetration_0(self);
};

btDispatcherInfo.prototype["set_m_allowedCcdPenetration"] = btDispatcherInfo.prototype.set_m_allowedCcdPenetration = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDispatcherInfo_set_m_allowedCcdPenetration_1(self, arg0);
};

Object.defineProperty(btDispatcherInfo.prototype, "m_allowedCcdPenetration", {
 get: btDispatcherInfo.prototype.get_m_allowedCcdPenetration,
 set: btDispatcherInfo.prototype.set_m_allowedCcdPenetration
});

btDispatcherInfo.prototype["get_m_useConvexConservativeDistanceUtil"] = btDispatcherInfo.prototype.get_m_useConvexConservativeDistanceUtil = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btDispatcherInfo_get_m_useConvexConservativeDistanceUtil_0(self);
};

btDispatcherInfo.prototype["set_m_useConvexConservativeDistanceUtil"] = btDispatcherInfo.prototype.set_m_useConvexConservativeDistanceUtil = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDispatcherInfo_set_m_useConvexConservativeDistanceUtil_1(self, arg0);
};

Object.defineProperty(btDispatcherInfo.prototype, "m_useConvexConservativeDistanceUtil", {
 get: btDispatcherInfo.prototype.get_m_useConvexConservativeDistanceUtil,
 set: btDispatcherInfo.prototype.set_m_useConvexConservativeDistanceUtil
});

btDispatcherInfo.prototype["get_m_convexConservativeDistanceThreshold"] = btDispatcherInfo.prototype.get_m_convexConservativeDistanceThreshold = function() {
 var self = this.ptr;
 return _emscripten_bind_btDispatcherInfo_get_m_convexConservativeDistanceThreshold_0(self);
};

btDispatcherInfo.prototype["set_m_convexConservativeDistanceThreshold"] = btDispatcherInfo.prototype.set_m_convexConservativeDistanceThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDispatcherInfo_set_m_convexConservativeDistanceThreshold_1(self, arg0);
};

Object.defineProperty(btDispatcherInfo.prototype, "m_convexConservativeDistanceThreshold", {
 get: btDispatcherInfo.prototype.get_m_convexConservativeDistanceThreshold,
 set: btDispatcherInfo.prototype.set_m_convexConservativeDistanceThreshold
});

btDispatcherInfo.prototype["__destroy__"] = btDispatcherInfo.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btDispatcherInfo___destroy___0(self);
};

function btConvexTriangleMeshShape(arg0, arg1) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg1 === undefined) {
  this.ptr = _emscripten_bind_btConvexTriangleMeshShape_btConvexTriangleMeshShape_1(arg0);
  getCache(btConvexTriangleMeshShape)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btConvexTriangleMeshShape_btConvexTriangleMeshShape_2(arg0, arg1);
 getCache(btConvexTriangleMeshShape)[this.ptr] = this;
}

btConvexTriangleMeshShape.prototype = Object.create(btConvexShape.prototype);

btConvexTriangleMeshShape.prototype.constructor = btConvexTriangleMeshShape;

btConvexTriangleMeshShape.prototype.__class__ = btConvexTriangleMeshShape;

btConvexTriangleMeshShape.__cache__ = {};

Module["btConvexTriangleMeshShape"] = btConvexTriangleMeshShape;

btConvexTriangleMeshShape.prototype["setLocalScaling"] = btConvexTriangleMeshShape.prototype.setLocalScaling = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConvexTriangleMeshShape_setLocalScaling_1(self, arg0);
};

btConvexTriangleMeshShape.prototype["getLocalScaling"] = btConvexTriangleMeshShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btConvexTriangleMeshShape_getLocalScaling_0(self), btVector3);
};

btConvexTriangleMeshShape.prototype["calculateLocalInertia"] = btConvexTriangleMeshShape.prototype.calculateLocalInertia = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btConvexTriangleMeshShape_calculateLocalInertia_2(self, arg0, arg1);
};

btConvexTriangleMeshShape.prototype["setMargin"] = btConvexTriangleMeshShape.prototype.setMargin = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConvexTriangleMeshShape_setMargin_1(self, arg0);
};

btConvexTriangleMeshShape.prototype["getMargin"] = btConvexTriangleMeshShape.prototype.getMargin = function() {
 var self = this.ptr;
 return _emscripten_bind_btConvexTriangleMeshShape_getMargin_0(self);
};

btConvexTriangleMeshShape.prototype["__destroy__"] = btConvexTriangleMeshShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btConvexTriangleMeshShape___destroy___0(self);
};

function btBroadphaseInterface() {
 throw "cannot construct a btBroadphaseInterface, no constructor in IDL";
}

btBroadphaseInterface.prototype = Object.create(WrapperObject.prototype);

btBroadphaseInterface.prototype.constructor = btBroadphaseInterface;

btBroadphaseInterface.prototype.__class__ = btBroadphaseInterface;

btBroadphaseInterface.__cache__ = {};

Module["btBroadphaseInterface"] = btBroadphaseInterface;

btBroadphaseInterface.prototype["__destroy__"] = btBroadphaseInterface.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btBroadphaseInterface___destroy___0(self);
};

function btDefaultCollisionConfiguration(arg0) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg0 === undefined) {
  this.ptr = _emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_0();
  getCache(btDefaultCollisionConfiguration)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btDefaultCollisionConfiguration_btDefaultCollisionConfiguration_1(arg0);
 getCache(btDefaultCollisionConfiguration)[this.ptr] = this;
}

btDefaultCollisionConfiguration.prototype = Object.create(WrapperObject.prototype);

btDefaultCollisionConfiguration.prototype.constructor = btDefaultCollisionConfiguration;

btDefaultCollisionConfiguration.prototype.__class__ = btDefaultCollisionConfiguration;

btDefaultCollisionConfiguration.__cache__ = {};

Module["btDefaultCollisionConfiguration"] = btDefaultCollisionConfiguration;

btDefaultCollisionConfiguration.prototype["__destroy__"] = btDefaultCollisionConfiguration.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btDefaultCollisionConfiguration___destroy___0(self);
};

function btRigidBodyConstructionInfo(arg0, arg1, arg2, arg3) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 if (arg3 === undefined) {
  this.ptr = _emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_3(arg0, arg1, arg2);
  getCache(btRigidBodyConstructionInfo)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btRigidBodyConstructionInfo_btRigidBodyConstructionInfo_4(arg0, arg1, arg2, arg3);
 getCache(btRigidBodyConstructionInfo)[this.ptr] = this;
}

btRigidBodyConstructionInfo.prototype = Object.create(WrapperObject.prototype);

btRigidBodyConstructionInfo.prototype.constructor = btRigidBodyConstructionInfo;

btRigidBodyConstructionInfo.prototype.__class__ = btRigidBodyConstructionInfo;

btRigidBodyConstructionInfo.__cache__ = {};

Module["btRigidBodyConstructionInfo"] = btRigidBodyConstructionInfo;

btRigidBodyConstructionInfo.prototype["get_m_linearDamping"] = btRigidBodyConstructionInfo.prototype.get_m_linearDamping = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBodyConstructionInfo_get_m_linearDamping_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_linearDamping"] = btRigidBodyConstructionInfo.prototype.set_m_linearDamping = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_linearDamping_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_linearDamping", {
 get: btRigidBodyConstructionInfo.prototype.get_m_linearDamping,
 set: btRigidBodyConstructionInfo.prototype.set_m_linearDamping
});

btRigidBodyConstructionInfo.prototype["get_m_angularDamping"] = btRigidBodyConstructionInfo.prototype.get_m_angularDamping = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBodyConstructionInfo_get_m_angularDamping_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_angularDamping"] = btRigidBodyConstructionInfo.prototype.set_m_angularDamping = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_angularDamping_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_angularDamping", {
 get: btRigidBodyConstructionInfo.prototype.get_m_angularDamping,
 set: btRigidBodyConstructionInfo.prototype.set_m_angularDamping
});

btRigidBodyConstructionInfo.prototype["get_m_friction"] = btRigidBodyConstructionInfo.prototype.get_m_friction = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBodyConstructionInfo_get_m_friction_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_friction"] = btRigidBodyConstructionInfo.prototype.set_m_friction = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_friction_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_friction", {
 get: btRigidBodyConstructionInfo.prototype.get_m_friction,
 set: btRigidBodyConstructionInfo.prototype.set_m_friction
});

btRigidBodyConstructionInfo.prototype["get_m_rollingFriction"] = btRigidBodyConstructionInfo.prototype.get_m_rollingFriction = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBodyConstructionInfo_get_m_rollingFriction_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_rollingFriction"] = btRigidBodyConstructionInfo.prototype.set_m_rollingFriction = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_rollingFriction_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_rollingFriction", {
 get: btRigidBodyConstructionInfo.prototype.get_m_rollingFriction,
 set: btRigidBodyConstructionInfo.prototype.set_m_rollingFriction
});

btRigidBodyConstructionInfo.prototype["get_m_restitution"] = btRigidBodyConstructionInfo.prototype.get_m_restitution = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBodyConstructionInfo_get_m_restitution_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_restitution"] = btRigidBodyConstructionInfo.prototype.set_m_restitution = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_restitution_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_restitution", {
 get: btRigidBodyConstructionInfo.prototype.get_m_restitution,
 set: btRigidBodyConstructionInfo.prototype.set_m_restitution
});

btRigidBodyConstructionInfo.prototype["get_m_linearSleepingThreshold"] = btRigidBodyConstructionInfo.prototype.get_m_linearSleepingThreshold = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBodyConstructionInfo_get_m_linearSleepingThreshold_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_linearSleepingThreshold"] = btRigidBodyConstructionInfo.prototype.set_m_linearSleepingThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_linearSleepingThreshold_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_linearSleepingThreshold", {
 get: btRigidBodyConstructionInfo.prototype.get_m_linearSleepingThreshold,
 set: btRigidBodyConstructionInfo.prototype.set_m_linearSleepingThreshold
});

btRigidBodyConstructionInfo.prototype["get_m_angularSleepingThreshold"] = btRigidBodyConstructionInfo.prototype.get_m_angularSleepingThreshold = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBodyConstructionInfo_get_m_angularSleepingThreshold_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_angularSleepingThreshold"] = btRigidBodyConstructionInfo.prototype.set_m_angularSleepingThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_angularSleepingThreshold_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_angularSleepingThreshold", {
 get: btRigidBodyConstructionInfo.prototype.get_m_angularSleepingThreshold,
 set: btRigidBodyConstructionInfo.prototype.set_m_angularSleepingThreshold
});

btRigidBodyConstructionInfo.prototype["get_m_additionalDamping"] = btRigidBodyConstructionInfo.prototype.get_m_additionalDamping = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalDamping_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_additionalDamping"] = btRigidBodyConstructionInfo.prototype.set_m_additionalDamping = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalDamping_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_additionalDamping", {
 get: btRigidBodyConstructionInfo.prototype.get_m_additionalDamping,
 set: btRigidBodyConstructionInfo.prototype.set_m_additionalDamping
});

btRigidBodyConstructionInfo.prototype["get_m_additionalDampingFactor"] = btRigidBodyConstructionInfo.prototype.get_m_additionalDampingFactor = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalDampingFactor_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_additionalDampingFactor"] = btRigidBodyConstructionInfo.prototype.set_m_additionalDampingFactor = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalDampingFactor_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_additionalDampingFactor", {
 get: btRigidBodyConstructionInfo.prototype.get_m_additionalDampingFactor,
 set: btRigidBodyConstructionInfo.prototype.set_m_additionalDampingFactor
});

btRigidBodyConstructionInfo.prototype["get_m_additionalLinearDampingThresholdSqr"] = btRigidBodyConstructionInfo.prototype.get_m_additionalLinearDampingThresholdSqr = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalLinearDampingThresholdSqr_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_additionalLinearDampingThresholdSqr"] = btRigidBodyConstructionInfo.prototype.set_m_additionalLinearDampingThresholdSqr = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalLinearDampingThresholdSqr_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_additionalLinearDampingThresholdSqr", {
 get: btRigidBodyConstructionInfo.prototype.get_m_additionalLinearDampingThresholdSqr,
 set: btRigidBodyConstructionInfo.prototype.set_m_additionalLinearDampingThresholdSqr
});

btRigidBodyConstructionInfo.prototype["get_m_additionalAngularDampingThresholdSqr"] = btRigidBodyConstructionInfo.prototype.get_m_additionalAngularDampingThresholdSqr = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalAngularDampingThresholdSqr_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_additionalAngularDampingThresholdSqr"] = btRigidBodyConstructionInfo.prototype.set_m_additionalAngularDampingThresholdSqr = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalAngularDampingThresholdSqr_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_additionalAngularDampingThresholdSqr", {
 get: btRigidBodyConstructionInfo.prototype.get_m_additionalAngularDampingThresholdSqr,
 set: btRigidBodyConstructionInfo.prototype.set_m_additionalAngularDampingThresholdSqr
});

btRigidBodyConstructionInfo.prototype["get_m_additionalAngularDampingFactor"] = btRigidBodyConstructionInfo.prototype.get_m_additionalAngularDampingFactor = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBodyConstructionInfo_get_m_additionalAngularDampingFactor_0(self);
};

btRigidBodyConstructionInfo.prototype["set_m_additionalAngularDampingFactor"] = btRigidBodyConstructionInfo.prototype.set_m_additionalAngularDampingFactor = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo_set_m_additionalAngularDampingFactor_1(self, arg0);
};

Object.defineProperty(btRigidBodyConstructionInfo.prototype, "m_additionalAngularDampingFactor", {
 get: btRigidBodyConstructionInfo.prototype.get_m_additionalAngularDampingFactor,
 set: btRigidBodyConstructionInfo.prototype.set_m_additionalAngularDampingFactor
});

btRigidBodyConstructionInfo.prototype["__destroy__"] = btRigidBodyConstructionInfo.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btRigidBodyConstructionInfo___destroy___0(self);
};

function btCollisionConfiguration() {
 throw "cannot construct a btCollisionConfiguration, no constructor in IDL";
}

btCollisionConfiguration.prototype = Object.create(WrapperObject.prototype);

btCollisionConfiguration.prototype.constructor = btCollisionConfiguration;

btCollisionConfiguration.prototype.__class__ = btCollisionConfiguration;

btCollisionConfiguration.__cache__ = {};

Module["btCollisionConfiguration"] = btCollisionConfiguration;

btCollisionConfiguration.prototype["__destroy__"] = btCollisionConfiguration.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCollisionConfiguration___destroy___0(self);
};

function btPersistentManifold() {
 this.ptr = _emscripten_bind_btPersistentManifold_btPersistentManifold_0();
 getCache(btPersistentManifold)[this.ptr] = this;
}

btPersistentManifold.prototype = Object.create(WrapperObject.prototype);

btPersistentManifold.prototype.constructor = btPersistentManifold;

btPersistentManifold.prototype.__class__ = btPersistentManifold;

btPersistentManifold.__cache__ = {};

Module["btPersistentManifold"] = btPersistentManifold;

btPersistentManifold.prototype["getBody0"] = btPersistentManifold.prototype.getBody0 = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btPersistentManifold_getBody0_0(self), btCollisionObject);
};

btPersistentManifold.prototype["getBody1"] = btPersistentManifold.prototype.getBody1 = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btPersistentManifold_getBody1_0(self), btCollisionObject);
};

btPersistentManifold.prototype["getNumContacts"] = btPersistentManifold.prototype.getNumContacts = function() {
 var self = this.ptr;
 return _emscripten_bind_btPersistentManifold_getNumContacts_0(self);
};

btPersistentManifold.prototype["getContactPoint"] = btPersistentManifold.prototype.getContactPoint = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return wrapPointer(_emscripten_bind_btPersistentManifold_getContactPoint_1(self, arg0), btManifoldPoint);
};

btPersistentManifold.prototype["__destroy__"] = btPersistentManifold.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btPersistentManifold___destroy___0(self);
};

function btCompoundShape(arg0) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg0 === undefined) {
  this.ptr = _emscripten_bind_btCompoundShape_btCompoundShape_0();
  getCache(btCompoundShape)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btCompoundShape_btCompoundShape_1(arg0);
 getCache(btCompoundShape)[this.ptr] = this;
}

btCompoundShape.prototype = Object.create(btCollisionShape.prototype);

btCompoundShape.prototype.constructor = btCompoundShape;

btCompoundShape.prototype.__class__ = btCompoundShape;

btCompoundShape.__cache__ = {};

Module["btCompoundShape"] = btCompoundShape;

btCompoundShape.prototype["addChildShape"] = btCompoundShape.prototype.addChildShape = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btCompoundShape_addChildShape_2(self, arg0, arg1);
};

btCompoundShape.prototype["removeChildShape"] = btCompoundShape.prototype.removeChildShape = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCompoundShape_removeChildShape_1(self, arg0);
};

btCompoundShape.prototype["removeChildShapeByIndex"] = btCompoundShape.prototype.removeChildShapeByIndex = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCompoundShape_removeChildShapeByIndex_1(self, arg0);
};

btCompoundShape.prototype["getNumChildShapes"] = btCompoundShape.prototype.getNumChildShapes = function() {
 var self = this.ptr;
 return _emscripten_bind_btCompoundShape_getNumChildShapes_0(self);
};

btCompoundShape.prototype["getChildShape"] = btCompoundShape.prototype.getChildShape = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return wrapPointer(_emscripten_bind_btCompoundShape_getChildShape_1(self, arg0), btCollisionShape);
};

btCompoundShape.prototype["setMargin"] = btCompoundShape.prototype.setMargin = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCompoundShape_setMargin_1(self, arg0);
};

btCompoundShape.prototype["getMargin"] = btCompoundShape.prototype.getMargin = function() {
 var self = this.ptr;
 return _emscripten_bind_btCompoundShape_getMargin_0(self);
};

btCompoundShape.prototype["setLocalScaling"] = btCompoundShape.prototype.setLocalScaling = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCompoundShape_setLocalScaling_1(self, arg0);
};

btCompoundShape.prototype["getLocalScaling"] = btCompoundShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCompoundShape_getLocalScaling_0(self), btVector3);
};

btCompoundShape.prototype["calculateLocalInertia"] = btCompoundShape.prototype.calculateLocalInertia = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btCompoundShape_calculateLocalInertia_2(self, arg0, arg1);
};

btCompoundShape.prototype["__destroy__"] = btCompoundShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCompoundShape___destroy___0(self);
};

function ClosestConvexResultCallback(arg0, arg1) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 this.ptr = _emscripten_bind_ClosestConvexResultCallback_ClosestConvexResultCallback_2(arg0, arg1);
 getCache(ClosestConvexResultCallback)[this.ptr] = this;
}

ClosestConvexResultCallback.prototype = Object.create(ConvexResultCallback.prototype);

ClosestConvexResultCallback.prototype.constructor = ClosestConvexResultCallback;

ClosestConvexResultCallback.prototype.__class__ = ClosestConvexResultCallback;

ClosestConvexResultCallback.__cache__ = {};

Module["ClosestConvexResultCallback"] = ClosestConvexResultCallback;

ClosestConvexResultCallback.prototype["hasHit"] = ClosestConvexResultCallback.prototype.hasHit = function() {
 var self = this.ptr;
 return !!_emscripten_bind_ClosestConvexResultCallback_hasHit_0(self);
};

ClosestConvexResultCallback.prototype["get_m_convexFromWorld"] = ClosestConvexResultCallback.prototype.get_m_convexFromWorld = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_ClosestConvexResultCallback_get_m_convexFromWorld_0(self), btVector3);
};

ClosestConvexResultCallback.prototype["set_m_convexFromWorld"] = ClosestConvexResultCallback.prototype.set_m_convexFromWorld = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_ClosestConvexResultCallback_set_m_convexFromWorld_1(self, arg0);
};

Object.defineProperty(ClosestConvexResultCallback.prototype, "m_convexFromWorld", {
 get: ClosestConvexResultCallback.prototype.get_m_convexFromWorld,
 set: ClosestConvexResultCallback.prototype.set_m_convexFromWorld
});

ClosestConvexResultCallback.prototype["get_m_convexToWorld"] = ClosestConvexResultCallback.prototype.get_m_convexToWorld = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_ClosestConvexResultCallback_get_m_convexToWorld_0(self), btVector3);
};

ClosestConvexResultCallback.prototype["set_m_convexToWorld"] = ClosestConvexResultCallback.prototype.set_m_convexToWorld = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_ClosestConvexResultCallback_set_m_convexToWorld_1(self, arg0);
};

Object.defineProperty(ClosestConvexResultCallback.prototype, "m_convexToWorld", {
 get: ClosestConvexResultCallback.prototype.get_m_convexToWorld,
 set: ClosestConvexResultCallback.prototype.set_m_convexToWorld
});

ClosestConvexResultCallback.prototype["get_m_hitNormalWorld"] = ClosestConvexResultCallback.prototype.get_m_hitNormalWorld = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_ClosestConvexResultCallback_get_m_hitNormalWorld_0(self), btVector3);
};

ClosestConvexResultCallback.prototype["set_m_hitNormalWorld"] = ClosestConvexResultCallback.prototype.set_m_hitNormalWorld = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_ClosestConvexResultCallback_set_m_hitNormalWorld_1(self, arg0);
};

Object.defineProperty(ClosestConvexResultCallback.prototype, "m_hitNormalWorld", {
 get: ClosestConvexResultCallback.prototype.get_m_hitNormalWorld,
 set: ClosestConvexResultCallback.prototype.set_m_hitNormalWorld
});

ClosestConvexResultCallback.prototype["get_m_hitPointWorld"] = ClosestConvexResultCallback.prototype.get_m_hitPointWorld = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_ClosestConvexResultCallback_get_m_hitPointWorld_0(self), btVector3);
};

ClosestConvexResultCallback.prototype["set_m_hitPointWorld"] = ClosestConvexResultCallback.prototype.set_m_hitPointWorld = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_ClosestConvexResultCallback_set_m_hitPointWorld_1(self, arg0);
};

Object.defineProperty(ClosestConvexResultCallback.prototype, "m_hitPointWorld", {
 get: ClosestConvexResultCallback.prototype.get_m_hitPointWorld,
 set: ClosestConvexResultCallback.prototype.set_m_hitPointWorld
});

ClosestConvexResultCallback.prototype["get_m_collisionFilterGroup"] = ClosestConvexResultCallback.prototype.get_m_collisionFilterGroup = function() {
 var self = this.ptr;
 return _emscripten_bind_ClosestConvexResultCallback_get_m_collisionFilterGroup_0(self);
};

ClosestConvexResultCallback.prototype["set_m_collisionFilterGroup"] = ClosestConvexResultCallback.prototype.set_m_collisionFilterGroup = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_ClosestConvexResultCallback_set_m_collisionFilterGroup_1(self, arg0);
};

Object.defineProperty(ClosestConvexResultCallback.prototype, "m_collisionFilterGroup", {
 get: ClosestConvexResultCallback.prototype.get_m_collisionFilterGroup,
 set: ClosestConvexResultCallback.prototype.set_m_collisionFilterGroup
});

ClosestConvexResultCallback.prototype["get_m_collisionFilterMask"] = ClosestConvexResultCallback.prototype.get_m_collisionFilterMask = function() {
 var self = this.ptr;
 return _emscripten_bind_ClosestConvexResultCallback_get_m_collisionFilterMask_0(self);
};

ClosestConvexResultCallback.prototype["set_m_collisionFilterMask"] = ClosestConvexResultCallback.prototype.set_m_collisionFilterMask = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_ClosestConvexResultCallback_set_m_collisionFilterMask_1(self, arg0);
};

Object.defineProperty(ClosestConvexResultCallback.prototype, "m_collisionFilterMask", {
 get: ClosestConvexResultCallback.prototype.get_m_collisionFilterMask,
 set: ClosestConvexResultCallback.prototype.set_m_collisionFilterMask
});

ClosestConvexResultCallback.prototype["get_m_closestHitFraction"] = ClosestConvexResultCallback.prototype.get_m_closestHitFraction = function() {
 var self = this.ptr;
 return _emscripten_bind_ClosestConvexResultCallback_get_m_closestHitFraction_0(self);
};

ClosestConvexResultCallback.prototype["set_m_closestHitFraction"] = ClosestConvexResultCallback.prototype.set_m_closestHitFraction = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_ClosestConvexResultCallback_set_m_closestHitFraction_1(self, arg0);
};

Object.defineProperty(ClosestConvexResultCallback.prototype, "m_closestHitFraction", {
 get: ClosestConvexResultCallback.prototype.get_m_closestHitFraction,
 set: ClosestConvexResultCallback.prototype.set_m_closestHitFraction
});

ClosestConvexResultCallback.prototype["__destroy__"] = ClosestConvexResultCallback.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_ClosestConvexResultCallback___destroy___0(self);
};

function btConstraintSetting() {
 this.ptr = _emscripten_bind_btConstraintSetting_btConstraintSetting_0();
 getCache(btConstraintSetting)[this.ptr] = this;
}

btConstraintSetting.prototype = Object.create(WrapperObject.prototype);

btConstraintSetting.prototype.constructor = btConstraintSetting;

btConstraintSetting.prototype.__class__ = btConstraintSetting;

btConstraintSetting.__cache__ = {};

Module["btConstraintSetting"] = btConstraintSetting;

btConstraintSetting.prototype["get_m_tau"] = btConstraintSetting.prototype.get_m_tau = function() {
 var self = this.ptr;
 return _emscripten_bind_btConstraintSetting_get_m_tau_0(self);
};

btConstraintSetting.prototype["set_m_tau"] = btConstraintSetting.prototype.set_m_tau = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConstraintSetting_set_m_tau_1(self, arg0);
};

Object.defineProperty(btConstraintSetting.prototype, "m_tau", {
 get: btConstraintSetting.prototype.get_m_tau,
 set: btConstraintSetting.prototype.set_m_tau
});

btConstraintSetting.prototype["get_m_damping"] = btConstraintSetting.prototype.get_m_damping = function() {
 var self = this.ptr;
 return _emscripten_bind_btConstraintSetting_get_m_damping_0(self);
};

btConstraintSetting.prototype["set_m_damping"] = btConstraintSetting.prototype.set_m_damping = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConstraintSetting_set_m_damping_1(self, arg0);
};

Object.defineProperty(btConstraintSetting.prototype, "m_damping", {
 get: btConstraintSetting.prototype.get_m_damping,
 set: btConstraintSetting.prototype.set_m_damping
});

btConstraintSetting.prototype["get_m_impulseClamp"] = btConstraintSetting.prototype.get_m_impulseClamp = function() {
 var self = this.ptr;
 return _emscripten_bind_btConstraintSetting_get_m_impulseClamp_0(self);
};

btConstraintSetting.prototype["set_m_impulseClamp"] = btConstraintSetting.prototype.set_m_impulseClamp = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConstraintSetting_set_m_impulseClamp_1(self, arg0);
};

Object.defineProperty(btConstraintSetting.prototype, "m_impulseClamp", {
 get: btConstraintSetting.prototype.get_m_impulseClamp,
 set: btConstraintSetting.prototype.set_m_impulseClamp
});

btConstraintSetting.prototype["__destroy__"] = btConstraintSetting.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btConstraintSetting___destroy___0(self);
};

function LocalShapeInfo() {
 throw "cannot construct a LocalShapeInfo, no constructor in IDL";
}

LocalShapeInfo.prototype = Object.create(WrapperObject.prototype);

LocalShapeInfo.prototype.constructor = LocalShapeInfo;

LocalShapeInfo.prototype.__class__ = LocalShapeInfo;

LocalShapeInfo.__cache__ = {};

Module["LocalShapeInfo"] = LocalShapeInfo;

LocalShapeInfo.prototype["get_m_shapePart"] = LocalShapeInfo.prototype.get_m_shapePart = function() {
 var self = this.ptr;
 return _emscripten_bind_LocalShapeInfo_get_m_shapePart_0(self);
};

LocalShapeInfo.prototype["set_m_shapePart"] = LocalShapeInfo.prototype.set_m_shapePart = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_LocalShapeInfo_set_m_shapePart_1(self, arg0);
};

Object.defineProperty(LocalShapeInfo.prototype, "m_shapePart", {
 get: LocalShapeInfo.prototype.get_m_shapePart,
 set: LocalShapeInfo.prototype.set_m_shapePart
});

LocalShapeInfo.prototype["get_m_triangleIndex"] = LocalShapeInfo.prototype.get_m_triangleIndex = function() {
 var self = this.ptr;
 return _emscripten_bind_LocalShapeInfo_get_m_triangleIndex_0(self);
};

LocalShapeInfo.prototype["set_m_triangleIndex"] = LocalShapeInfo.prototype.set_m_triangleIndex = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_LocalShapeInfo_set_m_triangleIndex_1(self, arg0);
};

Object.defineProperty(LocalShapeInfo.prototype, "m_triangleIndex", {
 get: LocalShapeInfo.prototype.get_m_triangleIndex,
 set: LocalShapeInfo.prototype.set_m_triangleIndex
});

LocalShapeInfo.prototype["__destroy__"] = LocalShapeInfo.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_LocalShapeInfo___destroy___0(self);
};

function btRigidBody(arg0) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 this.ptr = _emscripten_bind_btRigidBody_btRigidBody_1(arg0);
 getCache(btRigidBody)[this.ptr] = this;
}

btRigidBody.prototype = Object.create(btCollisionObject.prototype);

btRigidBody.prototype.constructor = btRigidBody;

btRigidBody.prototype.__class__ = btRigidBody;

btRigidBody.__cache__ = {};

Module["btRigidBody"] = btRigidBody;

btRigidBody.prototype["getCenterOfMassTransform"] = btRigidBody.prototype.getCenterOfMassTransform = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btRigidBody_getCenterOfMassTransform_0(self), btTransform);
};

btRigidBody.prototype["setCenterOfMassTransform"] = btRigidBody.prototype.setCenterOfMassTransform = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_setCenterOfMassTransform_1(self, arg0);
};

btRigidBody.prototype["setSleepingThresholds"] = btRigidBody.prototype.setSleepingThresholds = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btRigidBody_setSleepingThresholds_2(self, arg0, arg1);
};

btRigidBody.prototype["setDamping"] = btRigidBody.prototype.setDamping = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btRigidBody_setDamping_2(self, arg0, arg1);
};

btRigidBody.prototype["setMassProps"] = btRigidBody.prototype.setMassProps = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btRigidBody_setMassProps_2(self, arg0, arg1);
};

btRigidBody.prototype["setLinearFactor"] = btRigidBody.prototype.setLinearFactor = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_setLinearFactor_1(self, arg0);
};

btRigidBody.prototype["applyTorque"] = btRigidBody.prototype.applyTorque = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_applyTorque_1(self, arg0);
};

btRigidBody.prototype["applyLocalTorque"] = btRigidBody.prototype.applyLocalTorque = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_applyLocalTorque_1(self, arg0);
};

btRigidBody.prototype["applyForce"] = btRigidBody.prototype.applyForce = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btRigidBody_applyForce_2(self, arg0, arg1);
};

btRigidBody.prototype["applyCentralForce"] = btRigidBody.prototype.applyCentralForce = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_applyCentralForce_1(self, arg0);
};

btRigidBody.prototype["applyCentralLocalForce"] = btRigidBody.prototype.applyCentralLocalForce = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_applyCentralLocalForce_1(self, arg0);
};

btRigidBody.prototype["applyTorqueImpulse"] = btRigidBody.prototype.applyTorqueImpulse = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_applyTorqueImpulse_1(self, arg0);
};

btRigidBody.prototype["applyImpulse"] = btRigidBody.prototype.applyImpulse = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btRigidBody_applyImpulse_2(self, arg0, arg1);
};

btRigidBody.prototype["applyCentralImpulse"] = btRigidBody.prototype.applyCentralImpulse = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_applyCentralImpulse_1(self, arg0);
};

btRigidBody.prototype["updateInertiaTensor"] = btRigidBody.prototype.updateInertiaTensor = function() {
 var self = this.ptr;
 _emscripten_bind_btRigidBody_updateInertiaTensor_0(self);
};

btRigidBody.prototype["getLinearVelocity"] = btRigidBody.prototype.getLinearVelocity = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btRigidBody_getLinearVelocity_0(self), btVector3);
};

btRigidBody.prototype["getAngularVelocity"] = btRigidBody.prototype.getAngularVelocity = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btRigidBody_getAngularVelocity_0(self), btVector3);
};

btRigidBody.prototype["setLinearVelocity"] = btRigidBody.prototype.setLinearVelocity = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_setLinearVelocity_1(self, arg0);
};

btRigidBody.prototype["setAngularVelocity"] = btRigidBody.prototype.setAngularVelocity = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_setAngularVelocity_1(self, arg0);
};

btRigidBody.prototype["getMotionState"] = btRigidBody.prototype.getMotionState = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btRigidBody_getMotionState_0(self), btMotionState);
};

btRigidBody.prototype["setMotionState"] = btRigidBody.prototype.setMotionState = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_setMotionState_1(self, arg0);
};

btRigidBody.prototype["setAngularFactor"] = btRigidBody.prototype.setAngularFactor = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_setAngularFactor_1(self, arg0);
};

btRigidBody.prototype["upcast"] = btRigidBody.prototype.upcast = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return wrapPointer(_emscripten_bind_btRigidBody_upcast_1(self, arg0), btRigidBody);
};

btRigidBody.prototype["getAabb"] = btRigidBody.prototype.getAabb = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btRigidBody_getAabb_2(self, arg0, arg1);
};

btRigidBody.prototype["applyGravity"] = btRigidBody.prototype.applyGravity = function() {
 var self = this.ptr;
 _emscripten_bind_btRigidBody_applyGravity_0(self);
};

btRigidBody.prototype["getGravity"] = btRigidBody.prototype.getGravity = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btRigidBody_getGravity_0(self), btVector3);
};

btRigidBody.prototype["setGravity"] = btRigidBody.prototype.setGravity = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_setGravity_1(self, arg0);
};

btRigidBody.prototype["getBroadphaseProxy"] = btRigidBody.prototype.getBroadphaseProxy = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btRigidBody_getBroadphaseProxy_0(self), btBroadphaseProxy);
};

btRigidBody.prototype["setAnisotropicFriction"] = btRigidBody.prototype.setAnisotropicFriction = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btRigidBody_setAnisotropicFriction_2(self, arg0, arg1);
};

btRigidBody.prototype["getCollisionShape"] = btRigidBody.prototype.getCollisionShape = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btRigidBody_getCollisionShape_0(self), btCollisionShape);
};

btRigidBody.prototype["setContactProcessingThreshold"] = btRigidBody.prototype.setContactProcessingThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_setContactProcessingThreshold_1(self, arg0);
};

btRigidBody.prototype["setActivationState"] = btRigidBody.prototype.setActivationState = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_setActivationState_1(self, arg0);
};

btRigidBody.prototype["forceActivationState"] = btRigidBody.prototype.forceActivationState = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_forceActivationState_1(self, arg0);
};

btRigidBody.prototype["activate"] = btRigidBody.prototype.activate = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg0 === undefined) {
  _emscripten_bind_btRigidBody_activate_0(self);
  return;
 }
 _emscripten_bind_btRigidBody_activate_1(self, arg0);
};

btRigidBody.prototype["isActive"] = btRigidBody.prototype.isActive = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btRigidBody_isActive_0(self);
};

btRigidBody.prototype["isKinematicObject"] = btRigidBody.prototype.isKinematicObject = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btRigidBody_isKinematicObject_0(self);
};

btRigidBody.prototype["isStaticObject"] = btRigidBody.prototype.isStaticObject = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btRigidBody_isStaticObject_0(self);
};

btRigidBody.prototype["isStaticOrKinematicObject"] = btRigidBody.prototype.isStaticOrKinematicObject = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btRigidBody_isStaticOrKinematicObject_0(self);
};

btRigidBody.prototype["setRestitution"] = btRigidBody.prototype.setRestitution = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_setRestitution_1(self, arg0);
};

btRigidBody.prototype["setFriction"] = btRigidBody.prototype.setFriction = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_setFriction_1(self, arg0);
};

btRigidBody.prototype["setRollingFriction"] = btRigidBody.prototype.setRollingFriction = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_setRollingFriction_1(self, arg0);
};

btRigidBody.prototype["getWorldTransform"] = btRigidBody.prototype.getWorldTransform = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btRigidBody_getWorldTransform_0(self), btTransform);
};

btRigidBody.prototype["getCollisionFlags"] = btRigidBody.prototype.getCollisionFlags = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBody_getCollisionFlags_0(self);
};

btRigidBody.prototype["setCollisionFlags"] = btRigidBody.prototype.setCollisionFlags = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_setCollisionFlags_1(self, arg0);
};

btRigidBody.prototype["setWorldTransform"] = btRigidBody.prototype.setWorldTransform = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_setWorldTransform_1(self, arg0);
};

btRigidBody.prototype["setCollisionShape"] = btRigidBody.prototype.setCollisionShape = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_setCollisionShape_1(self, arg0);
};

btRigidBody.prototype["setCcdMotionThreshold"] = btRigidBody.prototype.setCcdMotionThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_setCcdMotionThreshold_1(self, arg0);
};

btRigidBody.prototype["setCcdSweptSphereRadius"] = btRigidBody.prototype.setCcdSweptSphereRadius = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_setCcdSweptSphereRadius_1(self, arg0);
};

btRigidBody.prototype["getUserIndex"] = btRigidBody.prototype.getUserIndex = function() {
 var self = this.ptr;
 return _emscripten_bind_btRigidBody_getUserIndex_0(self);
};

btRigidBody.prototype["setUserIndex"] = btRigidBody.prototype.setUserIndex = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_setUserIndex_1(self, arg0);
};

btRigidBody.prototype["getUserPointer"] = btRigidBody.prototype.getUserPointer = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btRigidBody_getUserPointer_0(self), VoidPtr);
};

btRigidBody.prototype["setUserPointer"] = btRigidBody.prototype.setUserPointer = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btRigidBody_setUserPointer_1(self, arg0);
};

btRigidBody.prototype["__destroy__"] = btRigidBody.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btRigidBody___destroy___0(self);
};

function btConvexPolyhedron() {
 throw "cannot construct a btConvexPolyhedron, no constructor in IDL";
}

btConvexPolyhedron.prototype = Object.create(WrapperObject.prototype);

btConvexPolyhedron.prototype.constructor = btConvexPolyhedron;

btConvexPolyhedron.prototype.__class__ = btConvexPolyhedron;

btConvexPolyhedron.__cache__ = {};

Module["btConvexPolyhedron"] = btConvexPolyhedron;

btConvexPolyhedron.prototype["get_m_vertices"] = btConvexPolyhedron.prototype.get_m_vertices = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btConvexPolyhedron_get_m_vertices_0(self), btVector3Array);
};

btConvexPolyhedron.prototype["set_m_vertices"] = btConvexPolyhedron.prototype.set_m_vertices = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConvexPolyhedron_set_m_vertices_1(self, arg0);
};

Object.defineProperty(btConvexPolyhedron.prototype, "m_vertices", {
 get: btConvexPolyhedron.prototype.get_m_vertices,
 set: btConvexPolyhedron.prototype.set_m_vertices
});

btConvexPolyhedron.prototype["get_m_faces"] = btConvexPolyhedron.prototype.get_m_faces = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btConvexPolyhedron_get_m_faces_0(self), btFaceArray);
};

btConvexPolyhedron.prototype["set_m_faces"] = btConvexPolyhedron.prototype.set_m_faces = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConvexPolyhedron_set_m_faces_1(self, arg0);
};

Object.defineProperty(btConvexPolyhedron.prototype, "m_faces", {
 get: btConvexPolyhedron.prototype.get_m_faces,
 set: btConvexPolyhedron.prototype.set_m_faces
});

btConvexPolyhedron.prototype["__destroy__"] = btConvexPolyhedron.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btConvexPolyhedron___destroy___0(self);
};

function btDbvtBroadphase() {
 this.ptr = _emscripten_bind_btDbvtBroadphase_btDbvtBroadphase_0();
 getCache(btDbvtBroadphase)[this.ptr] = this;
}

btDbvtBroadphase.prototype = Object.create(WrapperObject.prototype);

btDbvtBroadphase.prototype.constructor = btDbvtBroadphase;

btDbvtBroadphase.prototype.__class__ = btDbvtBroadphase;

btDbvtBroadphase.__cache__ = {};

Module["btDbvtBroadphase"] = btDbvtBroadphase;

btDbvtBroadphase.prototype["getOverlappingPairCache"] = btDbvtBroadphase.prototype.getOverlappingPairCache = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btDbvtBroadphase_getOverlappingPairCache_0(self), btOverlappingPairCache);
};

btDbvtBroadphase.prototype["__destroy__"] = btDbvtBroadphase.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btDbvtBroadphase___destroy___0(self);
};

function btHeightfieldTerrainShape(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 if (arg4 && typeof arg4 === "object") arg4 = arg4.ptr;
 if (arg5 && typeof arg5 === "object") arg5 = arg5.ptr;
 if (arg6 && typeof arg6 === "object") arg6 = arg6.ptr;
 if (arg7 && typeof arg7 === "object") arg7 = arg7.ptr;
 if (arg8 && typeof arg8 === "object") arg8 = arg8.ptr;
 this.ptr = _emscripten_bind_btHeightfieldTerrainShape_btHeightfieldTerrainShape_9(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
 getCache(btHeightfieldTerrainShape)[this.ptr] = this;
}

btHeightfieldTerrainShape.prototype = Object.create(btConcaveShape.prototype);

btHeightfieldTerrainShape.prototype.constructor = btHeightfieldTerrainShape;

btHeightfieldTerrainShape.prototype.__class__ = btHeightfieldTerrainShape;

btHeightfieldTerrainShape.__cache__ = {};

Module["btHeightfieldTerrainShape"] = btHeightfieldTerrainShape;

btHeightfieldTerrainShape.prototype["setMargin"] = btHeightfieldTerrainShape.prototype.setMargin = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btHeightfieldTerrainShape_setMargin_1(self, arg0);
};

btHeightfieldTerrainShape.prototype["getMargin"] = btHeightfieldTerrainShape.prototype.getMargin = function() {
 var self = this.ptr;
 return _emscripten_bind_btHeightfieldTerrainShape_getMargin_0(self);
};

btHeightfieldTerrainShape.prototype["setLocalScaling"] = btHeightfieldTerrainShape.prototype.setLocalScaling = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btHeightfieldTerrainShape_setLocalScaling_1(self, arg0);
};

btHeightfieldTerrainShape.prototype["getLocalScaling"] = btHeightfieldTerrainShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btHeightfieldTerrainShape_getLocalScaling_0(self), btVector3);
};

btHeightfieldTerrainShape.prototype["calculateLocalInertia"] = btHeightfieldTerrainShape.prototype.calculateLocalInertia = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btHeightfieldTerrainShape_calculateLocalInertia_2(self, arg0, arg1);
};

btHeightfieldTerrainShape.prototype["__destroy__"] = btHeightfieldTerrainShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btHeightfieldTerrainShape___destroy___0(self);
};

function btKinematicCharacterController(arg0, arg1, arg2, arg3) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 if (arg3 === undefined) {
  this.ptr = _emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_3(arg0, arg1, arg2);
  getCache(btKinematicCharacterController)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btKinematicCharacterController_btKinematicCharacterController_4(arg0, arg1, arg2, arg3);
 getCache(btKinematicCharacterController)[this.ptr] = this;
}

btKinematicCharacterController.prototype = Object.create(btActionInterface.prototype);

btKinematicCharacterController.prototype.constructor = btKinematicCharacterController;

btKinematicCharacterController.prototype.__class__ = btKinematicCharacterController;

btKinematicCharacterController.__cache__ = {};

Module["btKinematicCharacterController"] = btKinematicCharacterController;

btKinematicCharacterController.prototype["setUpAxis"] = btKinematicCharacterController.prototype.setUpAxis = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btKinematicCharacterController_setUpAxis_1(self, arg0);
};

btKinematicCharacterController.prototype["setWalkDirection"] = btKinematicCharacterController.prototype.setWalkDirection = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btKinematicCharacterController_setWalkDirection_1(self, arg0);
};

btKinematicCharacterController.prototype["setVelocityForTimeInterval"] = btKinematicCharacterController.prototype.setVelocityForTimeInterval = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btKinematicCharacterController_setVelocityForTimeInterval_2(self, arg0, arg1);
};

btKinematicCharacterController.prototype["warp"] = btKinematicCharacterController.prototype.warp = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btKinematicCharacterController_warp_1(self, arg0);
};

btKinematicCharacterController.prototype["preStep"] = btKinematicCharacterController.prototype.preStep = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btKinematicCharacterController_preStep_1(self, arg0);
};

btKinematicCharacterController.prototype["playerStep"] = btKinematicCharacterController.prototype.playerStep = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btKinematicCharacterController_playerStep_2(self, arg0, arg1);
};

btKinematicCharacterController.prototype["setFallSpeed"] = btKinematicCharacterController.prototype.setFallSpeed = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btKinematicCharacterController_setFallSpeed_1(self, arg0);
};

btKinematicCharacterController.prototype["setJumpSpeed"] = btKinematicCharacterController.prototype.setJumpSpeed = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btKinematicCharacterController_setJumpSpeed_1(self, arg0);
};

btKinematicCharacterController.prototype["setMaxJumpHeight"] = btKinematicCharacterController.prototype.setMaxJumpHeight = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btKinematicCharacterController_setMaxJumpHeight_1(self, arg0);
};

btKinematicCharacterController.prototype["canJump"] = btKinematicCharacterController.prototype.canJump = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btKinematicCharacterController_canJump_0(self);
};

btKinematicCharacterController.prototype["jump"] = btKinematicCharacterController.prototype.jump = function() {
 var self = this.ptr;
 _emscripten_bind_btKinematicCharacterController_jump_0(self);
};

btKinematicCharacterController.prototype["setGravity"] = btKinematicCharacterController.prototype.setGravity = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btKinematicCharacterController_setGravity_1(self, arg0);
};

btKinematicCharacterController.prototype["getGravity"] = btKinematicCharacterController.prototype.getGravity = function() {
 var self = this.ptr;
 return _emscripten_bind_btKinematicCharacterController_getGravity_0(self);
};

btKinematicCharacterController.prototype["setMaxSlope"] = btKinematicCharacterController.prototype.setMaxSlope = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btKinematicCharacterController_setMaxSlope_1(self, arg0);
};

btKinematicCharacterController.prototype["getMaxSlope"] = btKinematicCharacterController.prototype.getMaxSlope = function() {
 var self = this.ptr;
 return _emscripten_bind_btKinematicCharacterController_getMaxSlope_0(self);
};

btKinematicCharacterController.prototype["getGhostObject"] = btKinematicCharacterController.prototype.getGhostObject = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btKinematicCharacterController_getGhostObject_0(self), btPairCachingGhostObject);
};

btKinematicCharacterController.prototype["setUseGhostSweepTest"] = btKinematicCharacterController.prototype.setUseGhostSweepTest = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btKinematicCharacterController_setUseGhostSweepTest_1(self, arg0);
};

btKinematicCharacterController.prototype["onGround"] = btKinematicCharacterController.prototype.onGround = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btKinematicCharacterController_onGround_0(self);
};

btKinematicCharacterController.prototype["setUpInterpolate"] = btKinematicCharacterController.prototype.setUpInterpolate = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btKinematicCharacterController_setUpInterpolate_1(self, arg0);
};

btKinematicCharacterController.prototype["updateAction"] = btKinematicCharacterController.prototype.updateAction = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btKinematicCharacterController_updateAction_2(self, arg0, arg1);
};

btKinematicCharacterController.prototype["__destroy__"] = btKinematicCharacterController.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btKinematicCharacterController___destroy___0(self);
};

function btAxisSweep3(arg0, arg1, arg2, arg3, arg4) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 if (arg4 && typeof arg4 === "object") arg4 = arg4.ptr;
 if (arg2 === undefined) {
  this.ptr = _emscripten_bind_btAxisSweep3_btAxisSweep3_2(arg0, arg1);
  getCache(btAxisSweep3)[this.ptr] = this;
  return;
 }
 if (arg3 === undefined) {
  this.ptr = _emscripten_bind_btAxisSweep3_btAxisSweep3_3(arg0, arg1, arg2);
  getCache(btAxisSweep3)[this.ptr] = this;
  return;
 }
 if (arg4 === undefined) {
  this.ptr = _emscripten_bind_btAxisSweep3_btAxisSweep3_4(arg0, arg1, arg2, arg3);
  getCache(btAxisSweep3)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btAxisSweep3_btAxisSweep3_5(arg0, arg1, arg2, arg3, arg4);
 getCache(btAxisSweep3)[this.ptr] = this;
}

btAxisSweep3.prototype = Object.create(WrapperObject.prototype);

btAxisSweep3.prototype.constructor = btAxisSweep3;

btAxisSweep3.prototype.__class__ = btAxisSweep3;

btAxisSweep3.__cache__ = {};

Module["btAxisSweep3"] = btAxisSweep3;

btAxisSweep3.prototype["__destroy__"] = btAxisSweep3.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btAxisSweep3___destroy___0(self);
};

function btConeTwistConstraint(arg0, arg1, arg2, arg3) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 if (arg2 === undefined) {
  this.ptr = _emscripten_bind_btConeTwistConstraint_btConeTwistConstraint_2(arg0, arg1);
  getCache(btConeTwistConstraint)[this.ptr] = this;
  return;
 }
 if (arg3 === undefined) {
  this.ptr = _emscripten_bind_btConeTwistConstraint_btConeTwistConstraint_3(arg0, arg1, arg2);
  getCache(btConeTwistConstraint)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btConeTwistConstraint_btConeTwistConstraint_4(arg0, arg1, arg2, arg3);
 getCache(btConeTwistConstraint)[this.ptr] = this;
}

btConeTwistConstraint.prototype = Object.create(btTypedConstraint.prototype);

btConeTwistConstraint.prototype.constructor = btConeTwistConstraint;

btConeTwistConstraint.prototype.__class__ = btConeTwistConstraint;

btConeTwistConstraint.__cache__ = {};

Module["btConeTwistConstraint"] = btConeTwistConstraint;

btConeTwistConstraint.prototype["setLimit"] = btConeTwistConstraint.prototype.setLimit = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btConeTwistConstraint_setLimit_2(self, arg0, arg1);
};

btConeTwistConstraint.prototype["setAngularOnly"] = btConeTwistConstraint.prototype.setAngularOnly = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConeTwistConstraint_setAngularOnly_1(self, arg0);
};

btConeTwistConstraint.prototype["setDamping"] = btConeTwistConstraint.prototype.setDamping = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConeTwistConstraint_setDamping_1(self, arg0);
};

btConeTwistConstraint.prototype["enableMotor"] = btConeTwistConstraint.prototype.enableMotor = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConeTwistConstraint_enableMotor_1(self, arg0);
};

btConeTwistConstraint.prototype["setMaxMotorImpulse"] = btConeTwistConstraint.prototype.setMaxMotorImpulse = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConeTwistConstraint_setMaxMotorImpulse_1(self, arg0);
};

btConeTwistConstraint.prototype["setMaxMotorImpulseNormalized"] = btConeTwistConstraint.prototype.setMaxMotorImpulseNormalized = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConeTwistConstraint_setMaxMotorImpulseNormalized_1(self, arg0);
};

btConeTwistConstraint.prototype["setMotorTarget"] = btConeTwistConstraint.prototype.setMotorTarget = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConeTwistConstraint_setMotorTarget_1(self, arg0);
};

btConeTwistConstraint.prototype["setMotorTargetInConstraintSpace"] = btConeTwistConstraint.prototype.setMotorTargetInConstraintSpace = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConeTwistConstraint_setMotorTargetInConstraintSpace_1(self, arg0);
};

btConeTwistConstraint.prototype["enableFeedback"] = btConeTwistConstraint.prototype.enableFeedback = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConeTwistConstraint_enableFeedback_1(self, arg0);
};

btConeTwistConstraint.prototype["getBreakingImpulseThreshold"] = btConeTwistConstraint.prototype.getBreakingImpulseThreshold = function() {
 var self = this.ptr;
 return _emscripten_bind_btConeTwistConstraint_getBreakingImpulseThreshold_0(self);
};

btConeTwistConstraint.prototype["setBreakingImpulseThreshold"] = btConeTwistConstraint.prototype.setBreakingImpulseThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConeTwistConstraint_setBreakingImpulseThreshold_1(self, arg0);
};

btConeTwistConstraint.prototype["getParam"] = btConeTwistConstraint.prototype.getParam = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 return _emscripten_bind_btConeTwistConstraint_getParam_2(self, arg0, arg1);
};

btConeTwistConstraint.prototype["setParam"] = btConeTwistConstraint.prototype.setParam = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 _emscripten_bind_btConeTwistConstraint_setParam_3(self, arg0, arg1, arg2);
};

btConeTwistConstraint.prototype["__destroy__"] = btConeTwistConstraint.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btConeTwistConstraint___destroy___0(self);
};

function btHingeConstraint(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 if (arg4 && typeof arg4 === "object") arg4 = arg4.ptr;
 if (arg5 && typeof arg5 === "object") arg5 = arg5.ptr;
 if (arg6 && typeof arg6 === "object") arg6 = arg6.ptr;
 if (arg2 === undefined) {
  this.ptr = _emscripten_bind_btHingeConstraint_btHingeConstraint_2(arg0, arg1);
  getCache(btHingeConstraint)[this.ptr] = this;
  return;
 }
 if (arg3 === undefined) {
  this.ptr = _emscripten_bind_btHingeConstraint_btHingeConstraint_3(arg0, arg1, arg2);
  getCache(btHingeConstraint)[this.ptr] = this;
  return;
 }
 if (arg4 === undefined) {
  this.ptr = _emscripten_bind_btHingeConstraint_btHingeConstraint_4(arg0, arg1, arg2, arg3);
  getCache(btHingeConstraint)[this.ptr] = this;
  return;
 }
 if (arg5 === undefined) {
  this.ptr = _emscripten_bind_btHingeConstraint_btHingeConstraint_5(arg0, arg1, arg2, arg3, arg4);
  getCache(btHingeConstraint)[this.ptr] = this;
  return;
 }
 if (arg6 === undefined) {
  this.ptr = _emscripten_bind_btHingeConstraint_btHingeConstraint_6(arg0, arg1, arg2, arg3, arg4, arg5);
  getCache(btHingeConstraint)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btHingeConstraint_btHingeConstraint_7(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
 getCache(btHingeConstraint)[this.ptr] = this;
}

btHingeConstraint.prototype = Object.create(btTypedConstraint.prototype);

btHingeConstraint.prototype.constructor = btHingeConstraint;

btHingeConstraint.prototype.__class__ = btHingeConstraint;

btHingeConstraint.__cache__ = {};

Module["btHingeConstraint"] = btHingeConstraint;

btHingeConstraint.prototype["setLimit"] = btHingeConstraint.prototype.setLimit = function(arg0, arg1, arg2, arg3, arg4) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 if (arg4 && typeof arg4 === "object") arg4 = arg4.ptr;
 if (arg4 === undefined) {
  _emscripten_bind_btHingeConstraint_setLimit_4(self, arg0, arg1, arg2, arg3);
  return;
 }
 _emscripten_bind_btHingeConstraint_setLimit_5(self, arg0, arg1, arg2, arg3, arg4);
};

btHingeConstraint.prototype["enableAngularMotor"] = btHingeConstraint.prototype.enableAngularMotor = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 _emscripten_bind_btHingeConstraint_enableAngularMotor_3(self, arg0, arg1, arg2);
};

btHingeConstraint.prototype["setAngularOnly"] = btHingeConstraint.prototype.setAngularOnly = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btHingeConstraint_setAngularOnly_1(self, arg0);
};

btHingeConstraint.prototype["enableMotor"] = btHingeConstraint.prototype.enableMotor = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btHingeConstraint_enableMotor_1(self, arg0);
};

btHingeConstraint.prototype["setMaxMotorImpulse"] = btHingeConstraint.prototype.setMaxMotorImpulse = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btHingeConstraint_setMaxMotorImpulse_1(self, arg0);
};

btHingeConstraint.prototype["setMotorTarget"] = btHingeConstraint.prototype.setMotorTarget = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btHingeConstraint_setMotorTarget_2(self, arg0, arg1);
};

btHingeConstraint.prototype["enableFeedback"] = btHingeConstraint.prototype.enableFeedback = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btHingeConstraint_enableFeedback_1(self, arg0);
};

btHingeConstraint.prototype["getBreakingImpulseThreshold"] = btHingeConstraint.prototype.getBreakingImpulseThreshold = function() {
 var self = this.ptr;
 return _emscripten_bind_btHingeConstraint_getBreakingImpulseThreshold_0(self);
};

btHingeConstraint.prototype["setBreakingImpulseThreshold"] = btHingeConstraint.prototype.setBreakingImpulseThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btHingeConstraint_setBreakingImpulseThreshold_1(self, arg0);
};

btHingeConstraint.prototype["getParam"] = btHingeConstraint.prototype.getParam = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 return _emscripten_bind_btHingeConstraint_getParam_2(self, arg0, arg1);
};

btHingeConstraint.prototype["setParam"] = btHingeConstraint.prototype.setParam = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 _emscripten_bind_btHingeConstraint_setParam_3(self, arg0, arg1, arg2);
};

btHingeConstraint.prototype["__destroy__"] = btHingeConstraint.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btHingeConstraint___destroy___0(self);
};

function btConeShapeZ(arg0, arg1) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 this.ptr = _emscripten_bind_btConeShapeZ_btConeShapeZ_2(arg0, arg1);
 getCache(btConeShapeZ)[this.ptr] = this;
}

btConeShapeZ.prototype = Object.create(btConeShape.prototype);

btConeShapeZ.prototype.constructor = btConeShapeZ;

btConeShapeZ.prototype.__class__ = btConeShapeZ;

btConeShapeZ.__cache__ = {};

Module["btConeShapeZ"] = btConeShapeZ;

btConeShapeZ.prototype["setLocalScaling"] = btConeShapeZ.prototype.setLocalScaling = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConeShapeZ_setLocalScaling_1(self, arg0);
};

btConeShapeZ.prototype["getLocalScaling"] = btConeShapeZ.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btConeShapeZ_getLocalScaling_0(self), btVector3);
};

btConeShapeZ.prototype["calculateLocalInertia"] = btConeShapeZ.prototype.calculateLocalInertia = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btConeShapeZ_calculateLocalInertia_2(self, arg0, arg1);
};

btConeShapeZ.prototype["__destroy__"] = btConeShapeZ.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btConeShapeZ___destroy___0(self);
};

function btConeShapeX(arg0, arg1) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 this.ptr = _emscripten_bind_btConeShapeX_btConeShapeX_2(arg0, arg1);
 getCache(btConeShapeX)[this.ptr] = this;
}

btConeShapeX.prototype = Object.create(btConeShape.prototype);

btConeShapeX.prototype.constructor = btConeShapeX;

btConeShapeX.prototype.__class__ = btConeShapeX;

btConeShapeX.__cache__ = {};

Module["btConeShapeX"] = btConeShapeX;

btConeShapeX.prototype["setLocalScaling"] = btConeShapeX.prototype.setLocalScaling = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConeShapeX_setLocalScaling_1(self, arg0);
};

btConeShapeX.prototype["getLocalScaling"] = btConeShapeX.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btConeShapeX_getLocalScaling_0(self), btVector3);
};

btConeShapeX.prototype["calculateLocalInertia"] = btConeShapeX.prototype.calculateLocalInertia = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btConeShapeX_calculateLocalInertia_2(self, arg0, arg1);
};

btConeShapeX.prototype["__destroy__"] = btConeShapeX.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btConeShapeX___destroy___0(self);
};

function btTriangleMesh(arg0, arg1) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg0 === undefined) {
  this.ptr = _emscripten_bind_btTriangleMesh_btTriangleMesh_0();
  getCache(btTriangleMesh)[this.ptr] = this;
  return;
 }
 if (arg1 === undefined) {
  this.ptr = _emscripten_bind_btTriangleMesh_btTriangleMesh_1(arg0);
  getCache(btTriangleMesh)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btTriangleMesh_btTriangleMesh_2(arg0, arg1);
 getCache(btTriangleMesh)[this.ptr] = this;
}

btTriangleMesh.prototype = Object.create(btStridingMeshInterface.prototype);

btTriangleMesh.prototype.constructor = btTriangleMesh;

btTriangleMesh.prototype.__class__ = btTriangleMesh;

btTriangleMesh.__cache__ = {};

Module["btTriangleMesh"] = btTriangleMesh;

btTriangleMesh.prototype["addTriangle"] = btTriangleMesh.prototype.addTriangle = function(arg0, arg1, arg2, arg3) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 if (arg3 === undefined) {
  _emscripten_bind_btTriangleMesh_addTriangle_3(self, arg0, arg1, arg2);
  return;
 }
 _emscripten_bind_btTriangleMesh_addTriangle_4(self, arg0, arg1, arg2, arg3);
};

btTriangleMesh.prototype["setScaling"] = btTriangleMesh.prototype.setScaling = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btTriangleMesh_setScaling_1(self, arg0);
};

btTriangleMesh.prototype["__destroy__"] = btTriangleMesh.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btTriangleMesh___destroy___0(self);
};

function btConvexHullShape(arg0, arg1) {
 ensureCache.prepare();
 if (typeof arg0 == "object") {
  arg0 = ensureFloat32(arg0);
 }
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg0 === undefined) {
  this.ptr = _emscripten_bind_btConvexHullShape_btConvexHullShape_0();
  getCache(btConvexHullShape)[this.ptr] = this;
  return;
 }
 if (arg1 === undefined) {
  this.ptr = _emscripten_bind_btConvexHullShape_btConvexHullShape_1(arg0);
  getCache(btConvexHullShape)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btConvexHullShape_btConvexHullShape_2(arg0, arg1);
 getCache(btConvexHullShape)[this.ptr] = this;
}

btConvexHullShape.prototype = Object.create(btCollisionShape.prototype);

btConvexHullShape.prototype.constructor = btConvexHullShape;

btConvexHullShape.prototype.__class__ = btConvexHullShape;

btConvexHullShape.__cache__ = {};

Module["btConvexHullShape"] = btConvexHullShape;

btConvexHullShape.prototype["addPoint"] = btConvexHullShape.prototype.addPoint = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg1 === undefined) {
  _emscripten_bind_btConvexHullShape_addPoint_1(self, arg0);
  return;
 }
 _emscripten_bind_btConvexHullShape_addPoint_2(self, arg0, arg1);
};

btConvexHullShape.prototype["setMargin"] = btConvexHullShape.prototype.setMargin = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConvexHullShape_setMargin_1(self, arg0);
};

btConvexHullShape.prototype["getMargin"] = btConvexHullShape.prototype.getMargin = function() {
 var self = this.ptr;
 return _emscripten_bind_btConvexHullShape_getMargin_0(self);
};

btConvexHullShape.prototype["getNumVertices"] = btConvexHullShape.prototype.getNumVertices = function() {
 var self = this.ptr;
 return _emscripten_bind_btConvexHullShape_getNumVertices_0(self);
};

btConvexHullShape.prototype["initializePolyhedralFeatures"] = btConvexHullShape.prototype.initializePolyhedralFeatures = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return !!_emscripten_bind_btConvexHullShape_initializePolyhedralFeatures_1(self, arg0);
};

btConvexHullShape.prototype["recalcLocalAabb"] = btConvexHullShape.prototype.recalcLocalAabb = function() {
 var self = this.ptr;
 _emscripten_bind_btConvexHullShape_recalcLocalAabb_0(self);
};

btConvexHullShape.prototype["getConvexPolyhedron"] = btConvexHullShape.prototype.getConvexPolyhedron = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btConvexHullShape_getConvexPolyhedron_0(self), btConvexPolyhedron);
};

btConvexHullShape.prototype["setLocalScaling"] = btConvexHullShape.prototype.setLocalScaling = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btConvexHullShape_setLocalScaling_1(self, arg0);
};

btConvexHullShape.prototype["getLocalScaling"] = btConvexHullShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btConvexHullShape_getLocalScaling_0(self), btVector3);
};

btConvexHullShape.prototype["calculateLocalInertia"] = btConvexHullShape.prototype.calculateLocalInertia = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btConvexHullShape_calculateLocalInertia_2(self, arg0, arg1);
};

btConvexHullShape.prototype["__destroy__"] = btConvexHullShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btConvexHullShape___destroy___0(self);
};

function btCylinderShapeX(arg0) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 this.ptr = _emscripten_bind_btCylinderShapeX_btCylinderShapeX_1(arg0);
 getCache(btCylinderShapeX)[this.ptr] = this;
}

btCylinderShapeX.prototype = Object.create(btCylinderShape.prototype);

btCylinderShapeX.prototype.constructor = btCylinderShapeX;

btCylinderShapeX.prototype.__class__ = btCylinderShapeX;

btCylinderShapeX.__cache__ = {};

Module["btCylinderShapeX"] = btCylinderShapeX;

btCylinderShapeX.prototype["setMargin"] = btCylinderShapeX.prototype.setMargin = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCylinderShapeX_setMargin_1(self, arg0);
};

btCylinderShapeX.prototype["getMargin"] = btCylinderShapeX.prototype.getMargin = function() {
 var self = this.ptr;
 return _emscripten_bind_btCylinderShapeX_getMargin_0(self);
};

btCylinderShapeX.prototype["setLocalScaling"] = btCylinderShapeX.prototype.setLocalScaling = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCylinderShapeX_setLocalScaling_1(self, arg0);
};

btCylinderShapeX.prototype["getLocalScaling"] = btCylinderShapeX.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCylinderShapeX_getLocalScaling_0(self), btVector3);
};

btCylinderShapeX.prototype["calculateLocalInertia"] = btCylinderShapeX.prototype.calculateLocalInertia = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btCylinderShapeX_calculateLocalInertia_2(self, arg0, arg1);
};

btCylinderShapeX.prototype["__destroy__"] = btCylinderShapeX.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCylinderShapeX___destroy___0(self);
};

function btCollisionObjectWrapper() {
 throw "cannot construct a btCollisionObjectWrapper, no constructor in IDL";
}

btCollisionObjectWrapper.prototype = Object.create(WrapperObject.prototype);

btCollisionObjectWrapper.prototype.constructor = btCollisionObjectWrapper;

btCollisionObjectWrapper.prototype.__class__ = btCollisionObjectWrapper;

btCollisionObjectWrapper.__cache__ = {};

Module["btCollisionObjectWrapper"] = btCollisionObjectWrapper;

function btShapeHull(arg0) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 this.ptr = _emscripten_bind_btShapeHull_btShapeHull_1(arg0);
 getCache(btShapeHull)[this.ptr] = this;
}

btShapeHull.prototype = Object.create(WrapperObject.prototype);

btShapeHull.prototype.constructor = btShapeHull;

btShapeHull.prototype.__class__ = btShapeHull;

btShapeHull.__cache__ = {};

Module["btShapeHull"] = btShapeHull;

btShapeHull.prototype["buildHull"] = btShapeHull.prototype.buildHull = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return !!_emscripten_bind_btShapeHull_buildHull_1(self, arg0);
};

btShapeHull.prototype["numVertices"] = btShapeHull.prototype.numVertices = function() {
 var self = this.ptr;
 return _emscripten_bind_btShapeHull_numVertices_0(self);
};

btShapeHull.prototype["getVertexPointer"] = btShapeHull.prototype.getVertexPointer = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btShapeHull_getVertexPointer_0(self), btVector3);
};

btShapeHull.prototype["__destroy__"] = btShapeHull.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btShapeHull___destroy___0(self);
};

function btDefaultMotionState(arg0, arg1) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg0 === undefined) {
  this.ptr = _emscripten_bind_btDefaultMotionState_btDefaultMotionState_0();
  getCache(btDefaultMotionState)[this.ptr] = this;
  return;
 }
 if (arg1 === undefined) {
  this.ptr = _emscripten_bind_btDefaultMotionState_btDefaultMotionState_1(arg0);
  getCache(btDefaultMotionState)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btDefaultMotionState_btDefaultMotionState_2(arg0, arg1);
 getCache(btDefaultMotionState)[this.ptr] = this;
}

btDefaultMotionState.prototype = Object.create(btMotionState.prototype);

btDefaultMotionState.prototype.constructor = btDefaultMotionState;

btDefaultMotionState.prototype.__class__ = btDefaultMotionState;

btDefaultMotionState.__cache__ = {};

Module["btDefaultMotionState"] = btDefaultMotionState;

btDefaultMotionState.prototype["getWorldTransform"] = btDefaultMotionState.prototype.getWorldTransform = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDefaultMotionState_getWorldTransform_1(self, arg0);
};

btDefaultMotionState.prototype["setWorldTransform"] = btDefaultMotionState.prototype.setWorldTransform = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDefaultMotionState_setWorldTransform_1(self, arg0);
};

btDefaultMotionState.prototype["get_m_graphicsWorldTrans"] = btDefaultMotionState.prototype.get_m_graphicsWorldTrans = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btDefaultMotionState_get_m_graphicsWorldTrans_0(self), btTransform);
};

btDefaultMotionState.prototype["set_m_graphicsWorldTrans"] = btDefaultMotionState.prototype.set_m_graphicsWorldTrans = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDefaultMotionState_set_m_graphicsWorldTrans_1(self, arg0);
};

Object.defineProperty(btDefaultMotionState.prototype, "m_graphicsWorldTrans", {
 get: btDefaultMotionState.prototype.get_m_graphicsWorldTrans,
 set: btDefaultMotionState.prototype.set_m_graphicsWorldTrans
});

btDefaultMotionState.prototype["__destroy__"] = btDefaultMotionState.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btDefaultMotionState___destroy___0(self);
};

function btVector4(arg0, arg1, arg2, arg3) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 if (arg0 === undefined) {
  this.ptr = _emscripten_bind_btVector4_btVector4_0();
  getCache(btVector4)[this.ptr] = this;
  return;
 }
 if (arg1 === undefined) {
  this.ptr = _emscripten_bind_btVector4_btVector4_1(arg0);
  getCache(btVector4)[this.ptr] = this;
  return;
 }
 if (arg2 === undefined) {
  this.ptr = _emscripten_bind_btVector4_btVector4_2(arg0, arg1);
  getCache(btVector4)[this.ptr] = this;
  return;
 }
 if (arg3 === undefined) {
  this.ptr = _emscripten_bind_btVector4_btVector4_3(arg0, arg1, arg2);
  getCache(btVector4)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btVector4_btVector4_4(arg0, arg1, arg2, arg3);
 getCache(btVector4)[this.ptr] = this;
}

btVector4.prototype = Object.create(btVector3.prototype);

btVector4.prototype.constructor = btVector4;

btVector4.prototype.__class__ = btVector4;

btVector4.__cache__ = {};

Module["btVector4"] = btVector4;

btVector4.prototype["w"] = btVector4.prototype.w = function() {
 var self = this.ptr;
 return _emscripten_bind_btVector4_w_0(self);
};

btVector4.prototype["setValue"] = btVector4.prototype.setValue = function(arg0, arg1, arg2, arg3) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 _emscripten_bind_btVector4_setValue_4(self, arg0, arg1, arg2, arg3);
};

btVector4.prototype["length"] = btVector4.prototype.length = function() {
 var self = this.ptr;
 return _emscripten_bind_btVector4_length_0(self);
};

btVector4.prototype["x"] = btVector4.prototype.x = function() {
 var self = this.ptr;
 return _emscripten_bind_btVector4_x_0(self);
};

btVector4.prototype["y"] = btVector4.prototype.y = function() {
 var self = this.ptr;
 return _emscripten_bind_btVector4_y_0(self);
};

btVector4.prototype["z"] = btVector4.prototype.z = function() {
 var self = this.ptr;
 return _emscripten_bind_btVector4_z_0(self);
};

btVector4.prototype["setX"] = btVector4.prototype.setX = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btVector4_setX_1(self, arg0);
};

btVector4.prototype["setY"] = btVector4.prototype.setY = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btVector4_setY_1(self, arg0);
};

btVector4.prototype["setZ"] = btVector4.prototype.setZ = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btVector4_setZ_1(self, arg0);
};

btVector4.prototype["normalize"] = btVector4.prototype.normalize = function() {
 var self = this.ptr;
 _emscripten_bind_btVector4_normalize_0(self);
};

btVector4.prototype["rotate"] = btVector4.prototype.rotate = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 return wrapPointer(_emscripten_bind_btVector4_rotate_2(self, arg0, arg1), btVector3);
};

btVector4.prototype["dot"] = btVector4.prototype.dot = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return _emscripten_bind_btVector4_dot_1(self, arg0);
};

btVector4.prototype["op_mul"] = btVector4.prototype.op_mul = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return wrapPointer(_emscripten_bind_btVector4_op_mul_1(self, arg0), btVector3);
};

btVector4.prototype["op_add"] = btVector4.prototype.op_add = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return wrapPointer(_emscripten_bind_btVector4_op_add_1(self, arg0), btVector3);
};

btVector4.prototype["op_sub"] = btVector4.prototype.op_sub = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return wrapPointer(_emscripten_bind_btVector4_op_sub_1(self, arg0), btVector3);
};

btVector4.prototype["__destroy__"] = btVector4.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btVector4___destroy___0(self);
};

function btDefaultCollisionConstructionInfo() {
 this.ptr = _emscripten_bind_btDefaultCollisionConstructionInfo_btDefaultCollisionConstructionInfo_0();
 getCache(btDefaultCollisionConstructionInfo)[this.ptr] = this;
}

btDefaultCollisionConstructionInfo.prototype = Object.create(WrapperObject.prototype);

btDefaultCollisionConstructionInfo.prototype.constructor = btDefaultCollisionConstructionInfo;

btDefaultCollisionConstructionInfo.prototype.__class__ = btDefaultCollisionConstructionInfo;

btDefaultCollisionConstructionInfo.__cache__ = {};

Module["btDefaultCollisionConstructionInfo"] = btDefaultCollisionConstructionInfo;

btDefaultCollisionConstructionInfo.prototype["__destroy__"] = btDefaultCollisionConstructionInfo.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btDefaultCollisionConstructionInfo___destroy___0(self);
};

function btVector3Array() {
 throw "cannot construct a btVector3Array, no constructor in IDL";
}

btVector3Array.prototype = Object.create(WrapperObject.prototype);

btVector3Array.prototype.constructor = btVector3Array;

btVector3Array.prototype.__class__ = btVector3Array;

btVector3Array.__cache__ = {};

Module["btVector3Array"] = btVector3Array;

btVector3Array.prototype["size"] = btVector3Array.prototype.size = function() {
 var self = this.ptr;
 return _emscripten_bind_btVector3Array_size_0(self);
};

btVector3Array.prototype["at"] = btVector3Array.prototype.at = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return wrapPointer(_emscripten_bind_btVector3Array_at_1(self, arg0), btVector3);
};

btVector3Array.prototype["__destroy__"] = btVector3Array.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btVector3Array___destroy___0(self);
};

function btConstraintSolver() {
 throw "cannot construct a btConstraintSolver, no constructor in IDL";
}

btConstraintSolver.prototype = Object.create(WrapperObject.prototype);

btConstraintSolver.prototype.constructor = btConstraintSolver;

btConstraintSolver.prototype.__class__ = btConstraintSolver;

btConstraintSolver.__cache__ = {};

Module["btConstraintSolver"] = btConstraintSolver;

btConstraintSolver.prototype["__destroy__"] = btConstraintSolver.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btConstraintSolver___destroy___0(self);
};

function btGhostPairCallback() {
 this.ptr = _emscripten_bind_btGhostPairCallback_btGhostPairCallback_0();
 getCache(btGhostPairCallback)[this.ptr] = this;
}

btGhostPairCallback.prototype = Object.create(WrapperObject.prototype);

btGhostPairCallback.prototype.constructor = btGhostPairCallback;

btGhostPairCallback.prototype.__class__ = btGhostPairCallback;

btGhostPairCallback.__cache__ = {};

Module["btGhostPairCallback"] = btGhostPairCallback;

btGhostPairCallback.prototype["__destroy__"] = btGhostPairCallback.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btGhostPairCallback___destroy___0(self);
};

function btCylinderShapeZ(arg0) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 this.ptr = _emscripten_bind_btCylinderShapeZ_btCylinderShapeZ_1(arg0);
 getCache(btCylinderShapeZ)[this.ptr] = this;
}

btCylinderShapeZ.prototype = Object.create(btCylinderShape.prototype);

btCylinderShapeZ.prototype.constructor = btCylinderShapeZ;

btCylinderShapeZ.prototype.__class__ = btCylinderShapeZ;

btCylinderShapeZ.__cache__ = {};

Module["btCylinderShapeZ"] = btCylinderShapeZ;

btCylinderShapeZ.prototype["setMargin"] = btCylinderShapeZ.prototype.setMargin = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCylinderShapeZ_setMargin_1(self, arg0);
};

btCylinderShapeZ.prototype["getMargin"] = btCylinderShapeZ.prototype.getMargin = function() {
 var self = this.ptr;
 return _emscripten_bind_btCylinderShapeZ_getMargin_0(self);
};

btCylinderShapeZ.prototype["setLocalScaling"] = btCylinderShapeZ.prototype.setLocalScaling = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCylinderShapeZ_setLocalScaling_1(self, arg0);
};

btCylinderShapeZ.prototype["getLocalScaling"] = btCylinderShapeZ.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCylinderShapeZ_getLocalScaling_0(self), btVector3);
};

btCylinderShapeZ.prototype["calculateLocalInertia"] = btCylinderShapeZ.prototype.calculateLocalInertia = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btCylinderShapeZ_calculateLocalInertia_2(self, arg0, arg1);
};

btCylinderShapeZ.prototype["__destroy__"] = btCylinderShapeZ.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCylinderShapeZ___destroy___0(self);
};

function btSequentialImpulseConstraintSolver() {
 this.ptr = _emscripten_bind_btSequentialImpulseConstraintSolver_btSequentialImpulseConstraintSolver_0();
 getCache(btSequentialImpulseConstraintSolver)[this.ptr] = this;
}

btSequentialImpulseConstraintSolver.prototype = Object.create(WrapperObject.prototype);

btSequentialImpulseConstraintSolver.prototype.constructor = btSequentialImpulseConstraintSolver;

btSequentialImpulseConstraintSolver.prototype.__class__ = btSequentialImpulseConstraintSolver;

btSequentialImpulseConstraintSolver.__cache__ = {};

Module["btSequentialImpulseConstraintSolver"] = btSequentialImpulseConstraintSolver;

btSequentialImpulseConstraintSolver.prototype["__destroy__"] = btSequentialImpulseConstraintSolver.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btSequentialImpulseConstraintSolver___destroy___0(self);
};

function btIntArray() {
 throw "cannot construct a btIntArray, no constructor in IDL";
}

btIntArray.prototype = Object.create(WrapperObject.prototype);

btIntArray.prototype.constructor = btIntArray;

btIntArray.prototype.__class__ = btIntArray;

btIntArray.__cache__ = {};

Module["btIntArray"] = btIntArray;

btIntArray.prototype["size"] = btIntArray.prototype.size = function() {
 var self = this.ptr;
 return _emscripten_bind_btIntArray_size_0(self);
};

btIntArray.prototype["at"] = btIntArray.prototype.at = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return _emscripten_bind_btIntArray_at_1(self, arg0);
};

btIntArray.prototype["__destroy__"] = btIntArray.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btIntArray___destroy___0(self);
};

function btDiscreteDynamicsWorld(arg0, arg1, arg2, arg3) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 this.ptr = _emscripten_bind_btDiscreteDynamicsWorld_btDiscreteDynamicsWorld_4(arg0, arg1, arg2, arg3);
 getCache(btDiscreteDynamicsWorld)[this.ptr] = this;
}

btDiscreteDynamicsWorld.prototype = Object.create(btDynamicsWorld.prototype);

btDiscreteDynamicsWorld.prototype.constructor = btDiscreteDynamicsWorld;

btDiscreteDynamicsWorld.prototype.__class__ = btDiscreteDynamicsWorld;

btDiscreteDynamicsWorld.__cache__ = {};

Module["btDiscreteDynamicsWorld"] = btDiscreteDynamicsWorld;

btDiscreteDynamicsWorld.prototype["setGravity"] = btDiscreteDynamicsWorld.prototype.setGravity = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDiscreteDynamicsWorld_setGravity_1(self, arg0);
};

btDiscreteDynamicsWorld.prototype["getGravity"] = btDiscreteDynamicsWorld.prototype.getGravity = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btDiscreteDynamicsWorld_getGravity_0(self), btVector3);
};

btDiscreteDynamicsWorld.prototype["addRigidBody"] = btDiscreteDynamicsWorld.prototype.addRigidBody = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg1 === undefined) {
  _emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_1(self, arg0);
  return;
 }
 if (arg2 === undefined) {
  _emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_2(self, arg0, arg1);
  return;
 }
 _emscripten_bind_btDiscreteDynamicsWorld_addRigidBody_3(self, arg0, arg1, arg2);
};

btDiscreteDynamicsWorld.prototype["removeRigidBody"] = btDiscreteDynamicsWorld.prototype.removeRigidBody = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDiscreteDynamicsWorld_removeRigidBody_1(self, arg0);
};

btDiscreteDynamicsWorld.prototype["addConstraint"] = btDiscreteDynamicsWorld.prototype.addConstraint = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg1 === undefined) {
  _emscripten_bind_btDiscreteDynamicsWorld_addConstraint_1(self, arg0);
  return;
 }
 _emscripten_bind_btDiscreteDynamicsWorld_addConstraint_2(self, arg0, arg1);
};

btDiscreteDynamicsWorld.prototype["removeConstraint"] = btDiscreteDynamicsWorld.prototype.removeConstraint = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDiscreteDynamicsWorld_removeConstraint_1(self, arg0);
};

btDiscreteDynamicsWorld.prototype["stepSimulation"] = btDiscreteDynamicsWorld.prototype.stepSimulation = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg1 === undefined) {
  return _emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_1(self, arg0);
 }
 if (arg2 === undefined) {
  return _emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_2(self, arg0, arg1);
 }
 return _emscripten_bind_btDiscreteDynamicsWorld_stepSimulation_3(self, arg0, arg1, arg2);
};

btDiscreteDynamicsWorld.prototype["getDispatcher"] = btDiscreteDynamicsWorld.prototype.getDispatcher = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btDiscreteDynamicsWorld_getDispatcher_0(self), btDispatcher);
};

btDiscreteDynamicsWorld.prototype["rayTest"] = btDiscreteDynamicsWorld.prototype.rayTest = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 _emscripten_bind_btDiscreteDynamicsWorld_rayTest_3(self, arg0, arg1, arg2);
};

btDiscreteDynamicsWorld.prototype["getPairCache"] = btDiscreteDynamicsWorld.prototype.getPairCache = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btDiscreteDynamicsWorld_getPairCache_0(self), btOverlappingPairCache);
};

btDiscreteDynamicsWorld.prototype["getDispatchInfo"] = btDiscreteDynamicsWorld.prototype.getDispatchInfo = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btDiscreteDynamicsWorld_getDispatchInfo_0(self), btDispatcherInfo);
};

btDiscreteDynamicsWorld.prototype["addCollisionObject"] = btDiscreteDynamicsWorld.prototype.addCollisionObject = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg1 === undefined) {
  _emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_1(self, arg0);
  return;
 }
 if (arg2 === undefined) {
  _emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_2(self, arg0, arg1);
  return;
 }
 _emscripten_bind_btDiscreteDynamicsWorld_addCollisionObject_3(self, arg0, arg1, arg2);
};

btDiscreteDynamicsWorld.prototype["removeCollisionObject"] = btDiscreteDynamicsWorld.prototype.removeCollisionObject = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDiscreteDynamicsWorld_removeCollisionObject_1(self, arg0);
};

btDiscreteDynamicsWorld.prototype["getBroadphase"] = btDiscreteDynamicsWorld.prototype.getBroadphase = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btDiscreteDynamicsWorld_getBroadphase_0(self), btBroadphaseInterface);
};

btDiscreteDynamicsWorld.prototype["convexSweepTest"] = btDiscreteDynamicsWorld.prototype.convexSweepTest = function(arg0, arg1, arg2, arg3, arg4) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 if (arg4 && typeof arg4 === "object") arg4 = arg4.ptr;
 _emscripten_bind_btDiscreteDynamicsWorld_convexSweepTest_5(self, arg0, arg1, arg2, arg3, arg4);
};

btDiscreteDynamicsWorld.prototype["contactPairTest"] = btDiscreteDynamicsWorld.prototype.contactPairTest = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 _emscripten_bind_btDiscreteDynamicsWorld_contactPairTest_3(self, arg0, arg1, arg2);
};

btDiscreteDynamicsWorld.prototype["contactTest"] = btDiscreteDynamicsWorld.prototype.contactTest = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btDiscreteDynamicsWorld_contactTest_2(self, arg0, arg1);
};

btDiscreteDynamicsWorld.prototype["setForceUpdateAllAabbs"] = btDiscreteDynamicsWorld.prototype.setForceUpdateAllAabbs = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDiscreteDynamicsWorld_setForceUpdateAllAabbs_1(self, arg0);
};

btDiscreteDynamicsWorld.prototype["updateSingleAabb"] = btDiscreteDynamicsWorld.prototype.updateSingleAabb = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDiscreteDynamicsWorld_updateSingleAabb_1(self, arg0);
};

btDiscreteDynamicsWorld.prototype["setDebugDrawer"] = btDiscreteDynamicsWorld.prototype.setDebugDrawer = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDiscreteDynamicsWorld_setDebugDrawer_1(self, arg0);
};

btDiscreteDynamicsWorld.prototype["getDebugDrawer"] = btDiscreteDynamicsWorld.prototype.getDebugDrawer = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btDiscreteDynamicsWorld_getDebugDrawer_0(self), btIDebugDraw);
};

btDiscreteDynamicsWorld.prototype["debugDrawWorld"] = btDiscreteDynamicsWorld.prototype.debugDrawWorld = function() {
 var self = this.ptr;
 _emscripten_bind_btDiscreteDynamicsWorld_debugDrawWorld_0(self);
};

btDiscreteDynamicsWorld.prototype["debugDrawObject"] = btDiscreteDynamicsWorld.prototype.debugDrawObject = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 _emscripten_bind_btDiscreteDynamicsWorld_debugDrawObject_3(self, arg0, arg1, arg2);
};

btDiscreteDynamicsWorld.prototype["addAction"] = btDiscreteDynamicsWorld.prototype.addAction = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDiscreteDynamicsWorld_addAction_1(self, arg0);
};

btDiscreteDynamicsWorld.prototype["removeAction"] = btDiscreteDynamicsWorld.prototype.removeAction = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btDiscreteDynamicsWorld_removeAction_1(self, arg0);
};

btDiscreteDynamicsWorld.prototype["getSolverInfo"] = btDiscreteDynamicsWorld.prototype.getSolverInfo = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btDiscreteDynamicsWorld_getSolverInfo_0(self), btContactSolverInfo);
};

btDiscreteDynamicsWorld.prototype["__destroy__"] = btDiscreteDynamicsWorld.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btDiscreteDynamicsWorld___destroy___0(self);
};

function btOverlappingPairCallback() {
 throw "cannot construct a btOverlappingPairCallback, no constructor in IDL";
}

btOverlappingPairCallback.prototype = Object.create(WrapperObject.prototype);

btOverlappingPairCallback.prototype.constructor = btOverlappingPairCallback;

btOverlappingPairCallback.prototype.__class__ = btOverlappingPairCallback;

btOverlappingPairCallback.__cache__ = {};

Module["btOverlappingPairCallback"] = btOverlappingPairCallback;

btOverlappingPairCallback.prototype["__destroy__"] = btOverlappingPairCallback.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btOverlappingPairCallback___destroy___0(self);
};

function btCollisionDispatcher(arg0) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 this.ptr = _emscripten_bind_btCollisionDispatcher_btCollisionDispatcher_1(arg0);
 getCache(btCollisionDispatcher)[this.ptr] = this;
}

btCollisionDispatcher.prototype = Object.create(btDispatcher.prototype);

btCollisionDispatcher.prototype.constructor = btCollisionDispatcher;

btCollisionDispatcher.prototype.__class__ = btCollisionDispatcher;

btCollisionDispatcher.__cache__ = {};

Module["btCollisionDispatcher"] = btCollisionDispatcher;

btCollisionDispatcher.prototype["getNumManifolds"] = btCollisionDispatcher.prototype.getNumManifolds = function() {
 var self = this.ptr;
 return _emscripten_bind_btCollisionDispatcher_getNumManifolds_0(self);
};

btCollisionDispatcher.prototype["getManifoldByIndexInternal"] = btCollisionDispatcher.prototype.getManifoldByIndexInternal = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return wrapPointer(_emscripten_bind_btCollisionDispatcher_getManifoldByIndexInternal_1(self, arg0), btPersistentManifold);
};

btCollisionDispatcher.prototype["__destroy__"] = btCollisionDispatcher.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCollisionDispatcher___destroy___0(self);
};

function btFaceArray() {
 throw "cannot construct a btFaceArray, no constructor in IDL";
}

btFaceArray.prototype = Object.create(WrapperObject.prototype);

btFaceArray.prototype.constructor = btFaceArray;

btFaceArray.prototype.__class__ = btFaceArray;

btFaceArray.__cache__ = {};

Module["btFaceArray"] = btFaceArray;

btFaceArray.prototype["size"] = btFaceArray.prototype.size = function() {
 var self = this.ptr;
 return _emscripten_bind_btFaceArray_size_0(self);
};

btFaceArray.prototype["at"] = btFaceArray.prototype.at = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return wrapPointer(_emscripten_bind_btFaceArray_at_1(self, arg0), btFace);
};

btFaceArray.prototype["__destroy__"] = btFaceArray.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btFaceArray___destroy___0(self);
};

function btStaticPlaneShape(arg0, arg1) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 this.ptr = _emscripten_bind_btStaticPlaneShape_btStaticPlaneShape_2(arg0, arg1);
 getCache(btStaticPlaneShape)[this.ptr] = this;
}

btStaticPlaneShape.prototype = Object.create(btConcaveShape.prototype);

btStaticPlaneShape.prototype.constructor = btStaticPlaneShape;

btStaticPlaneShape.prototype.__class__ = btStaticPlaneShape;

btStaticPlaneShape.__cache__ = {};

Module["btStaticPlaneShape"] = btStaticPlaneShape;

btStaticPlaneShape.prototype["setLocalScaling"] = btStaticPlaneShape.prototype.setLocalScaling = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btStaticPlaneShape_setLocalScaling_1(self, arg0);
};

btStaticPlaneShape.prototype["getLocalScaling"] = btStaticPlaneShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btStaticPlaneShape_getLocalScaling_0(self), btVector3);
};

btStaticPlaneShape.prototype["calculateLocalInertia"] = btStaticPlaneShape.prototype.calculateLocalInertia = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btStaticPlaneShape_calculateLocalInertia_2(self, arg0, arg1);
};

btStaticPlaneShape.prototype["__destroy__"] = btStaticPlaneShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btStaticPlaneShape___destroy___0(self);
};

function btOverlappingPairCache() {
 throw "cannot construct a btOverlappingPairCache, no constructor in IDL";
}

btOverlappingPairCache.prototype = Object.create(WrapperObject.prototype);

btOverlappingPairCache.prototype.constructor = btOverlappingPairCache;

btOverlappingPairCache.prototype.__class__ = btOverlappingPairCache;

btOverlappingPairCache.__cache__ = {};

Module["btOverlappingPairCache"] = btOverlappingPairCache;

btOverlappingPairCache.prototype["setInternalGhostPairCallback"] = btOverlappingPairCache.prototype.setInternalGhostPairCallback = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btOverlappingPairCache_setInternalGhostPairCallback_1(self, arg0);
};

btOverlappingPairCache.prototype["removeOverlappingPairsContainingProxy"] = btOverlappingPairCache.prototype.removeOverlappingPairsContainingProxy = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btOverlappingPairCache_removeOverlappingPairsContainingProxy_2(self, arg0, arg1);
};

btOverlappingPairCache.prototype["__destroy__"] = btOverlappingPairCache.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btOverlappingPairCache___destroy___0(self);
};

function btFixedConstraint(arg0, arg1, arg2, arg3) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 this.ptr = _emscripten_bind_btFixedConstraint_btFixedConstraint_4(arg0, arg1, arg2, arg3);
 getCache(btFixedConstraint)[this.ptr] = this;
}

btFixedConstraint.prototype = Object.create(btTypedConstraint.prototype);

btFixedConstraint.prototype.constructor = btFixedConstraint;

btFixedConstraint.prototype.__class__ = btFixedConstraint;

btFixedConstraint.__cache__ = {};

Module["btFixedConstraint"] = btFixedConstraint;

btFixedConstraint.prototype["enableFeedback"] = btFixedConstraint.prototype.enableFeedback = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btFixedConstraint_enableFeedback_1(self, arg0);
};

btFixedConstraint.prototype["getBreakingImpulseThreshold"] = btFixedConstraint.prototype.getBreakingImpulseThreshold = function() {
 var self = this.ptr;
 return _emscripten_bind_btFixedConstraint_getBreakingImpulseThreshold_0(self);
};

btFixedConstraint.prototype["setBreakingImpulseThreshold"] = btFixedConstraint.prototype.setBreakingImpulseThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btFixedConstraint_setBreakingImpulseThreshold_1(self, arg0);
};

btFixedConstraint.prototype["getParam"] = btFixedConstraint.prototype.getParam = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 return _emscripten_bind_btFixedConstraint_getParam_2(self, arg0, arg1);
};

btFixedConstraint.prototype["setParam"] = btFixedConstraint.prototype.setParam = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 _emscripten_bind_btFixedConstraint_setParam_3(self, arg0, arg1, arg2);
};

btFixedConstraint.prototype["__destroy__"] = btFixedConstraint.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btFixedConstraint___destroy___0(self);
};

function btTransform(arg0, arg1) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg0 === undefined) {
  this.ptr = _emscripten_bind_btTransform_btTransform_0();
  getCache(btTransform)[this.ptr] = this;
  return;
 }
 if (arg1 === undefined) {
  this.ptr = _emscripten_bind_btTransform_btTransform_1(arg0);
  getCache(btTransform)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btTransform_btTransform_2(arg0, arg1);
 getCache(btTransform)[this.ptr] = this;
}

btTransform.prototype = Object.create(WrapperObject.prototype);

btTransform.prototype.constructor = btTransform;

btTransform.prototype.__class__ = btTransform;

btTransform.__cache__ = {};

Module["btTransform"] = btTransform;

btTransform.prototype["setIdentity"] = btTransform.prototype.setIdentity = function() {
 var self = this.ptr;
 _emscripten_bind_btTransform_setIdentity_0(self);
};

btTransform.prototype["setOrigin"] = btTransform.prototype.setOrigin = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btTransform_setOrigin_1(self, arg0);
};

btTransform.prototype["setRotation"] = btTransform.prototype.setRotation = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btTransform_setRotation_1(self, arg0);
};

btTransform.prototype["getOrigin"] = btTransform.prototype.getOrigin = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btTransform_getOrigin_0(self), btVector3);
};

btTransform.prototype["getRotation"] = btTransform.prototype.getRotation = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btTransform_getRotation_0(self), btQuaternion);
};

btTransform.prototype["getBasis"] = btTransform.prototype.getBasis = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btTransform_getBasis_0(self), btMatrix3x3);
};

btTransform.prototype["setFromOpenGLMatrix"] = btTransform.prototype.setFromOpenGLMatrix = function(arg0) {
 var self = this.ptr;
 ensureCache.prepare();
 if (typeof arg0 == "object") {
  arg0 = ensureFloat32(arg0);
 }
 _emscripten_bind_btTransform_setFromOpenGLMatrix_1(self, arg0);
};

btTransform.prototype["inverse"] = btTransform.prototype.inverse = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btTransform_inverse_0(self), btTransform);
};

btTransform.prototype["op_mul"] = btTransform.prototype.op_mul = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return wrapPointer(_emscripten_bind_btTransform_op_mul_1(self, arg0), btTransform);
};

btTransform.prototype["__destroy__"] = btTransform.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btTransform___destroy___0(self);
};

function ClosestRayResultCallback(arg0, arg1) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 this.ptr = _emscripten_bind_ClosestRayResultCallback_ClosestRayResultCallback_2(arg0, arg1);
 getCache(ClosestRayResultCallback)[this.ptr] = this;
}

ClosestRayResultCallback.prototype = Object.create(RayResultCallback.prototype);

ClosestRayResultCallback.prototype.constructor = ClosestRayResultCallback;

ClosestRayResultCallback.prototype.__class__ = ClosestRayResultCallback;

ClosestRayResultCallback.__cache__ = {};

Module["ClosestRayResultCallback"] = ClosestRayResultCallback;

ClosestRayResultCallback.prototype["hasHit"] = ClosestRayResultCallback.prototype.hasHit = function() {
 var self = this.ptr;
 return !!_emscripten_bind_ClosestRayResultCallback_hasHit_0(self);
};

ClosestRayResultCallback.prototype["get_m_rayFromWorld"] = ClosestRayResultCallback.prototype.get_m_rayFromWorld = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_ClosestRayResultCallback_get_m_rayFromWorld_0(self), btVector3);
};

ClosestRayResultCallback.prototype["set_m_rayFromWorld"] = ClosestRayResultCallback.prototype.set_m_rayFromWorld = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_ClosestRayResultCallback_set_m_rayFromWorld_1(self, arg0);
};

Object.defineProperty(ClosestRayResultCallback.prototype, "m_rayFromWorld", {
 get: ClosestRayResultCallback.prototype.get_m_rayFromWorld,
 set: ClosestRayResultCallback.prototype.set_m_rayFromWorld
});

ClosestRayResultCallback.prototype["get_m_rayToWorld"] = ClosestRayResultCallback.prototype.get_m_rayToWorld = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_ClosestRayResultCallback_get_m_rayToWorld_0(self), btVector3);
};

ClosestRayResultCallback.prototype["set_m_rayToWorld"] = ClosestRayResultCallback.prototype.set_m_rayToWorld = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_ClosestRayResultCallback_set_m_rayToWorld_1(self, arg0);
};

Object.defineProperty(ClosestRayResultCallback.prototype, "m_rayToWorld", {
 get: ClosestRayResultCallback.prototype.get_m_rayToWorld,
 set: ClosestRayResultCallback.prototype.set_m_rayToWorld
});

ClosestRayResultCallback.prototype["get_m_hitNormalWorld"] = ClosestRayResultCallback.prototype.get_m_hitNormalWorld = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_ClosestRayResultCallback_get_m_hitNormalWorld_0(self), btVector3);
};

ClosestRayResultCallback.prototype["set_m_hitNormalWorld"] = ClosestRayResultCallback.prototype.set_m_hitNormalWorld = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_ClosestRayResultCallback_set_m_hitNormalWorld_1(self, arg0);
};

Object.defineProperty(ClosestRayResultCallback.prototype, "m_hitNormalWorld", {
 get: ClosestRayResultCallback.prototype.get_m_hitNormalWorld,
 set: ClosestRayResultCallback.prototype.set_m_hitNormalWorld
});

ClosestRayResultCallback.prototype["get_m_hitPointWorld"] = ClosestRayResultCallback.prototype.get_m_hitPointWorld = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_ClosestRayResultCallback_get_m_hitPointWorld_0(self), btVector3);
};

ClosestRayResultCallback.prototype["set_m_hitPointWorld"] = ClosestRayResultCallback.prototype.set_m_hitPointWorld = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_ClosestRayResultCallback_set_m_hitPointWorld_1(self, arg0);
};

Object.defineProperty(ClosestRayResultCallback.prototype, "m_hitPointWorld", {
 get: ClosestRayResultCallback.prototype.get_m_hitPointWorld,
 set: ClosestRayResultCallback.prototype.set_m_hitPointWorld
});

ClosestRayResultCallback.prototype["get_m_collisionFilterGroup"] = ClosestRayResultCallback.prototype.get_m_collisionFilterGroup = function() {
 var self = this.ptr;
 return _emscripten_bind_ClosestRayResultCallback_get_m_collisionFilterGroup_0(self);
};

ClosestRayResultCallback.prototype["set_m_collisionFilterGroup"] = ClosestRayResultCallback.prototype.set_m_collisionFilterGroup = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_ClosestRayResultCallback_set_m_collisionFilterGroup_1(self, arg0);
};

Object.defineProperty(ClosestRayResultCallback.prototype, "m_collisionFilterGroup", {
 get: ClosestRayResultCallback.prototype.get_m_collisionFilterGroup,
 set: ClosestRayResultCallback.prototype.set_m_collisionFilterGroup
});

ClosestRayResultCallback.prototype["get_m_collisionFilterMask"] = ClosestRayResultCallback.prototype.get_m_collisionFilterMask = function() {
 var self = this.ptr;
 return _emscripten_bind_ClosestRayResultCallback_get_m_collisionFilterMask_0(self);
};

ClosestRayResultCallback.prototype["set_m_collisionFilterMask"] = ClosestRayResultCallback.prototype.set_m_collisionFilterMask = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_ClosestRayResultCallback_set_m_collisionFilterMask_1(self, arg0);
};

Object.defineProperty(ClosestRayResultCallback.prototype, "m_collisionFilterMask", {
 get: ClosestRayResultCallback.prototype.get_m_collisionFilterMask,
 set: ClosestRayResultCallback.prototype.set_m_collisionFilterMask
});

ClosestRayResultCallback.prototype["get_m_closestHitFraction"] = ClosestRayResultCallback.prototype.get_m_closestHitFraction = function() {
 var self = this.ptr;
 return _emscripten_bind_ClosestRayResultCallback_get_m_closestHitFraction_0(self);
};

ClosestRayResultCallback.prototype["set_m_closestHitFraction"] = ClosestRayResultCallback.prototype.set_m_closestHitFraction = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_ClosestRayResultCallback_set_m_closestHitFraction_1(self, arg0);
};

Object.defineProperty(ClosestRayResultCallback.prototype, "m_closestHitFraction", {
 get: ClosestRayResultCallback.prototype.get_m_closestHitFraction,
 set: ClosestRayResultCallback.prototype.set_m_closestHitFraction
});

ClosestRayResultCallback.prototype["get_m_collisionObject"] = ClosestRayResultCallback.prototype.get_m_collisionObject = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_ClosestRayResultCallback_get_m_collisionObject_0(self), btCollisionObject);
};

ClosestRayResultCallback.prototype["set_m_collisionObject"] = ClosestRayResultCallback.prototype.set_m_collisionObject = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_ClosestRayResultCallback_set_m_collisionObject_1(self, arg0);
};

Object.defineProperty(ClosestRayResultCallback.prototype, "m_collisionObject", {
 get: ClosestRayResultCallback.prototype.get_m_collisionObject,
 set: ClosestRayResultCallback.prototype.set_m_collisionObject
});

ClosestRayResultCallback.prototype["__destroy__"] = ClosestRayResultCallback.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_ClosestRayResultCallback___destroy___0(self);
};

function ConcreteContactResultCallback() {
 this.ptr = _emscripten_bind_ConcreteContactResultCallback_ConcreteContactResultCallback_0();
 getCache(ConcreteContactResultCallback)[this.ptr] = this;
}

ConcreteContactResultCallback.prototype = Object.create(ContactResultCallback.prototype);

ConcreteContactResultCallback.prototype.constructor = ConcreteContactResultCallback;

ConcreteContactResultCallback.prototype.__class__ = ConcreteContactResultCallback;

ConcreteContactResultCallback.__cache__ = {};

Module["ConcreteContactResultCallback"] = ConcreteContactResultCallback;

ConcreteContactResultCallback.prototype["addSingleResult"] = ConcreteContactResultCallback.prototype.addSingleResult = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 if (arg4 && typeof arg4 === "object") arg4 = arg4.ptr;
 if (arg5 && typeof arg5 === "object") arg5 = arg5.ptr;
 if (arg6 && typeof arg6 === "object") arg6 = arg6.ptr;
 return _emscripten_bind_ConcreteContactResultCallback_addSingleResult_7(self, arg0, arg1, arg2, arg3, arg4, arg5, arg6);
};

ConcreteContactResultCallback.prototype["__destroy__"] = ConcreteContactResultCallback.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_ConcreteContactResultCallback___destroy___0(self);
};

function btBvhTriangleMeshShape(arg0, arg1, arg2) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg2 === undefined) {
  this.ptr = _emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_2(arg0, arg1);
  getCache(btBvhTriangleMeshShape)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btBvhTriangleMeshShape_btBvhTriangleMeshShape_3(arg0, arg1, arg2);
 getCache(btBvhTriangleMeshShape)[this.ptr] = this;
}

btBvhTriangleMeshShape.prototype = Object.create(btTriangleMeshShape.prototype);

btBvhTriangleMeshShape.prototype.constructor = btBvhTriangleMeshShape;

btBvhTriangleMeshShape.prototype.__class__ = btBvhTriangleMeshShape;

btBvhTriangleMeshShape.__cache__ = {};

Module["btBvhTriangleMeshShape"] = btBvhTriangleMeshShape;

btBvhTriangleMeshShape.prototype["setLocalScaling"] = btBvhTriangleMeshShape.prototype.setLocalScaling = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btBvhTriangleMeshShape_setLocalScaling_1(self, arg0);
};

btBvhTriangleMeshShape.prototype["getLocalScaling"] = btBvhTriangleMeshShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btBvhTriangleMeshShape_getLocalScaling_0(self), btVector3);
};

btBvhTriangleMeshShape.prototype["calculateLocalInertia"] = btBvhTriangleMeshShape.prototype.calculateLocalInertia = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btBvhTriangleMeshShape_calculateLocalInertia_2(self, arg0, arg1);
};

btBvhTriangleMeshShape.prototype["__destroy__"] = btBvhTriangleMeshShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btBvhTriangleMeshShape___destroy___0(self);
};

function btSliderConstraint(arg0, arg1, arg2, arg3, arg4) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 if (arg4 && typeof arg4 === "object") arg4 = arg4.ptr;
 if (arg3 === undefined) {
  this.ptr = _emscripten_bind_btSliderConstraint_btSliderConstraint_3(arg0, arg1, arg2);
  getCache(btSliderConstraint)[this.ptr] = this;
  return;
 }
 if (arg4 === undefined) {
  this.ptr = _emscripten_bind_btSliderConstraint_btSliderConstraint_4(arg0, arg1, arg2, arg3);
  getCache(btSliderConstraint)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btSliderConstraint_btSliderConstraint_5(arg0, arg1, arg2, arg3, arg4);
 getCache(btSliderConstraint)[this.ptr] = this;
}

btSliderConstraint.prototype = Object.create(btTypedConstraint.prototype);

btSliderConstraint.prototype.constructor = btSliderConstraint;

btSliderConstraint.prototype.__class__ = btSliderConstraint;

btSliderConstraint.__cache__ = {};

Module["btSliderConstraint"] = btSliderConstraint;

btSliderConstraint.prototype["setLowerLinLimit"] = btSliderConstraint.prototype.setLowerLinLimit = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btSliderConstraint_setLowerLinLimit_1(self, arg0);
};

btSliderConstraint.prototype["setUpperLinLimit"] = btSliderConstraint.prototype.setUpperLinLimit = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btSliderConstraint_setUpperLinLimit_1(self, arg0);
};

btSliderConstraint.prototype["setLowerAngLimit"] = btSliderConstraint.prototype.setLowerAngLimit = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btSliderConstraint_setLowerAngLimit_1(self, arg0);
};

btSliderConstraint.prototype["setUpperAngLimit"] = btSliderConstraint.prototype.setUpperAngLimit = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btSliderConstraint_setUpperAngLimit_1(self, arg0);
};

btSliderConstraint.prototype["enableFeedback"] = btSliderConstraint.prototype.enableFeedback = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btSliderConstraint_enableFeedback_1(self, arg0);
};

btSliderConstraint.prototype["getBreakingImpulseThreshold"] = btSliderConstraint.prototype.getBreakingImpulseThreshold = function() {
 var self = this.ptr;
 return _emscripten_bind_btSliderConstraint_getBreakingImpulseThreshold_0(self);
};

btSliderConstraint.prototype["setBreakingImpulseThreshold"] = btSliderConstraint.prototype.setBreakingImpulseThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btSliderConstraint_setBreakingImpulseThreshold_1(self, arg0);
};

btSliderConstraint.prototype["getParam"] = btSliderConstraint.prototype.getParam = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 return _emscripten_bind_btSliderConstraint_getParam_2(self, arg0, arg1);
};

btSliderConstraint.prototype["setParam"] = btSliderConstraint.prototype.setParam = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 _emscripten_bind_btSliderConstraint_setParam_3(self, arg0, arg1, arg2);
};

btSliderConstraint.prototype["__destroy__"] = btSliderConstraint.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btSliderConstraint___destroy___0(self);
};

function btPairCachingGhostObject() {
 this.ptr = _emscripten_bind_btPairCachingGhostObject_btPairCachingGhostObject_0();
 getCache(btPairCachingGhostObject)[this.ptr] = this;
}

btPairCachingGhostObject.prototype = Object.create(btGhostObject.prototype);

btPairCachingGhostObject.prototype.constructor = btPairCachingGhostObject;

btPairCachingGhostObject.prototype.__class__ = btPairCachingGhostObject;

btPairCachingGhostObject.__cache__ = {};

Module["btPairCachingGhostObject"] = btPairCachingGhostObject;

btPairCachingGhostObject.prototype["setAnisotropicFriction"] = btPairCachingGhostObject.prototype.setAnisotropicFriction = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btPairCachingGhostObject_setAnisotropicFriction_2(self, arg0, arg1);
};

btPairCachingGhostObject.prototype["getCollisionShape"] = btPairCachingGhostObject.prototype.getCollisionShape = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btPairCachingGhostObject_getCollisionShape_0(self), btCollisionShape);
};

btPairCachingGhostObject.prototype["setContactProcessingThreshold"] = btPairCachingGhostObject.prototype.setContactProcessingThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btPairCachingGhostObject_setContactProcessingThreshold_1(self, arg0);
};

btPairCachingGhostObject.prototype["setActivationState"] = btPairCachingGhostObject.prototype.setActivationState = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btPairCachingGhostObject_setActivationState_1(self, arg0);
};

btPairCachingGhostObject.prototype["forceActivationState"] = btPairCachingGhostObject.prototype.forceActivationState = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btPairCachingGhostObject_forceActivationState_1(self, arg0);
};

btPairCachingGhostObject.prototype["activate"] = btPairCachingGhostObject.prototype.activate = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg0 === undefined) {
  _emscripten_bind_btPairCachingGhostObject_activate_0(self);
  return;
 }
 _emscripten_bind_btPairCachingGhostObject_activate_1(self, arg0);
};

btPairCachingGhostObject.prototype["isActive"] = btPairCachingGhostObject.prototype.isActive = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btPairCachingGhostObject_isActive_0(self);
};

btPairCachingGhostObject.prototype["isKinematicObject"] = btPairCachingGhostObject.prototype.isKinematicObject = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btPairCachingGhostObject_isKinematicObject_0(self);
};

btPairCachingGhostObject.prototype["isStaticObject"] = btPairCachingGhostObject.prototype.isStaticObject = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btPairCachingGhostObject_isStaticObject_0(self);
};

btPairCachingGhostObject.prototype["isStaticOrKinematicObject"] = btPairCachingGhostObject.prototype.isStaticOrKinematicObject = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btPairCachingGhostObject_isStaticOrKinematicObject_0(self);
};

btPairCachingGhostObject.prototype["setRestitution"] = btPairCachingGhostObject.prototype.setRestitution = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btPairCachingGhostObject_setRestitution_1(self, arg0);
};

btPairCachingGhostObject.prototype["setFriction"] = btPairCachingGhostObject.prototype.setFriction = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btPairCachingGhostObject_setFriction_1(self, arg0);
};

btPairCachingGhostObject.prototype["setRollingFriction"] = btPairCachingGhostObject.prototype.setRollingFriction = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btPairCachingGhostObject_setRollingFriction_1(self, arg0);
};

btPairCachingGhostObject.prototype["getWorldTransform"] = btPairCachingGhostObject.prototype.getWorldTransform = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btPairCachingGhostObject_getWorldTransform_0(self), btTransform);
};

btPairCachingGhostObject.prototype["getCollisionFlags"] = btPairCachingGhostObject.prototype.getCollisionFlags = function() {
 var self = this.ptr;
 return _emscripten_bind_btPairCachingGhostObject_getCollisionFlags_0(self);
};

btPairCachingGhostObject.prototype["setCollisionFlags"] = btPairCachingGhostObject.prototype.setCollisionFlags = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btPairCachingGhostObject_setCollisionFlags_1(self, arg0);
};

btPairCachingGhostObject.prototype["setWorldTransform"] = btPairCachingGhostObject.prototype.setWorldTransform = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btPairCachingGhostObject_setWorldTransform_1(self, arg0);
};

btPairCachingGhostObject.prototype["setCollisionShape"] = btPairCachingGhostObject.prototype.setCollisionShape = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btPairCachingGhostObject_setCollisionShape_1(self, arg0);
};

btPairCachingGhostObject.prototype["setCcdMotionThreshold"] = btPairCachingGhostObject.prototype.setCcdMotionThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btPairCachingGhostObject_setCcdMotionThreshold_1(self, arg0);
};

btPairCachingGhostObject.prototype["setCcdSweptSphereRadius"] = btPairCachingGhostObject.prototype.setCcdSweptSphereRadius = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btPairCachingGhostObject_setCcdSweptSphereRadius_1(self, arg0);
};

btPairCachingGhostObject.prototype["getUserIndex"] = btPairCachingGhostObject.prototype.getUserIndex = function() {
 var self = this.ptr;
 return _emscripten_bind_btPairCachingGhostObject_getUserIndex_0(self);
};

btPairCachingGhostObject.prototype["setUserIndex"] = btPairCachingGhostObject.prototype.setUserIndex = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btPairCachingGhostObject_setUserIndex_1(self, arg0);
};

btPairCachingGhostObject.prototype["getUserPointer"] = btPairCachingGhostObject.prototype.getUserPointer = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btPairCachingGhostObject_getUserPointer_0(self), VoidPtr);
};

btPairCachingGhostObject.prototype["setUserPointer"] = btPairCachingGhostObject.prototype.setUserPointer = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btPairCachingGhostObject_setUserPointer_1(self, arg0);
};

btPairCachingGhostObject.prototype["getNumOverlappingObjects"] = btPairCachingGhostObject.prototype.getNumOverlappingObjects = function() {
 var self = this.ptr;
 return _emscripten_bind_btPairCachingGhostObject_getNumOverlappingObjects_0(self);
};

btPairCachingGhostObject.prototype["getOverlappingObject"] = btPairCachingGhostObject.prototype.getOverlappingObject = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return wrapPointer(_emscripten_bind_btPairCachingGhostObject_getOverlappingObject_1(self, arg0), btCollisionObject);
};

btPairCachingGhostObject.prototype["__destroy__"] = btPairCachingGhostObject.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btPairCachingGhostObject___destroy___0(self);
};

function btManifoldPoint() {
 throw "cannot construct a btManifoldPoint, no constructor in IDL";
}

btManifoldPoint.prototype = Object.create(WrapperObject.prototype);

btManifoldPoint.prototype.constructor = btManifoldPoint;

btManifoldPoint.prototype.__class__ = btManifoldPoint;

btManifoldPoint.__cache__ = {};

Module["btManifoldPoint"] = btManifoldPoint;

btManifoldPoint.prototype["getPositionWorldOnA"] = btManifoldPoint.prototype.getPositionWorldOnA = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btManifoldPoint_getPositionWorldOnA_0(self), btVector3);
};

btManifoldPoint.prototype["getPositionWorldOnB"] = btManifoldPoint.prototype.getPositionWorldOnB = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btManifoldPoint_getPositionWorldOnB_0(self), btVector3);
};

btManifoldPoint.prototype["getAppliedImpulse"] = btManifoldPoint.prototype.getAppliedImpulse = function() {
 var self = this.ptr;
 return _emscripten_bind_btManifoldPoint_getAppliedImpulse_0(self);
};

btManifoldPoint.prototype["getDistance"] = btManifoldPoint.prototype.getDistance = function() {
 var self = this.ptr;
 return _emscripten_bind_btManifoldPoint_getDistance_0(self);
};

btManifoldPoint.prototype["get_m_localPointA"] = btManifoldPoint.prototype.get_m_localPointA = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btManifoldPoint_get_m_localPointA_0(self), btVector3);
};

btManifoldPoint.prototype["set_m_localPointA"] = btManifoldPoint.prototype.set_m_localPointA = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btManifoldPoint_set_m_localPointA_1(self, arg0);
};

Object.defineProperty(btManifoldPoint.prototype, "m_localPointA", {
 get: btManifoldPoint.prototype.get_m_localPointA,
 set: btManifoldPoint.prototype.set_m_localPointA
});

btManifoldPoint.prototype["get_m_localPointB"] = btManifoldPoint.prototype.get_m_localPointB = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btManifoldPoint_get_m_localPointB_0(self), btVector3);
};

btManifoldPoint.prototype["set_m_localPointB"] = btManifoldPoint.prototype.set_m_localPointB = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btManifoldPoint_set_m_localPointB_1(self, arg0);
};

Object.defineProperty(btManifoldPoint.prototype, "m_localPointB", {
 get: btManifoldPoint.prototype.get_m_localPointB,
 set: btManifoldPoint.prototype.set_m_localPointB
});

btManifoldPoint.prototype["get_m_positionWorldOnB"] = btManifoldPoint.prototype.get_m_positionWorldOnB = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btManifoldPoint_get_m_positionWorldOnB_0(self), btVector3);
};

btManifoldPoint.prototype["set_m_positionWorldOnB"] = btManifoldPoint.prototype.set_m_positionWorldOnB = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btManifoldPoint_set_m_positionWorldOnB_1(self, arg0);
};

Object.defineProperty(btManifoldPoint.prototype, "m_positionWorldOnB", {
 get: btManifoldPoint.prototype.get_m_positionWorldOnB,
 set: btManifoldPoint.prototype.set_m_positionWorldOnB
});

btManifoldPoint.prototype["get_m_positionWorldOnA"] = btManifoldPoint.prototype.get_m_positionWorldOnA = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btManifoldPoint_get_m_positionWorldOnA_0(self), btVector3);
};

btManifoldPoint.prototype["set_m_positionWorldOnA"] = btManifoldPoint.prototype.set_m_positionWorldOnA = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btManifoldPoint_set_m_positionWorldOnA_1(self, arg0);
};

Object.defineProperty(btManifoldPoint.prototype, "m_positionWorldOnA", {
 get: btManifoldPoint.prototype.get_m_positionWorldOnA,
 set: btManifoldPoint.prototype.set_m_positionWorldOnA
});

btManifoldPoint.prototype["get_m_normalWorldOnB"] = btManifoldPoint.prototype.get_m_normalWorldOnB = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btManifoldPoint_get_m_normalWorldOnB_0(self), btVector3);
};

btManifoldPoint.prototype["set_m_normalWorldOnB"] = btManifoldPoint.prototype.set_m_normalWorldOnB = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btManifoldPoint_set_m_normalWorldOnB_1(self, arg0);
};

Object.defineProperty(btManifoldPoint.prototype, "m_normalWorldOnB", {
 get: btManifoldPoint.prototype.get_m_normalWorldOnB,
 set: btManifoldPoint.prototype.set_m_normalWorldOnB
});

btManifoldPoint.prototype["__destroy__"] = btManifoldPoint.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btManifoldPoint___destroy___0(self);
};

function btPoint2PointConstraint(arg0, arg1, arg2, arg3) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 if (arg2 === undefined) {
  this.ptr = _emscripten_bind_btPoint2PointConstraint_btPoint2PointConstraint_2(arg0, arg1);
  getCache(btPoint2PointConstraint)[this.ptr] = this;
  return;
 }
 if (arg3 === undefined) {
  this.ptr = _emscripten_bind_btPoint2PointConstraint_btPoint2PointConstraint_3(arg0, arg1, arg2);
  getCache(btPoint2PointConstraint)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btPoint2PointConstraint_btPoint2PointConstraint_4(arg0, arg1, arg2, arg3);
 getCache(btPoint2PointConstraint)[this.ptr] = this;
}

btPoint2PointConstraint.prototype = Object.create(btTypedConstraint.prototype);

btPoint2PointConstraint.prototype.constructor = btPoint2PointConstraint;

btPoint2PointConstraint.prototype.__class__ = btPoint2PointConstraint;

btPoint2PointConstraint.__cache__ = {};

Module["btPoint2PointConstraint"] = btPoint2PointConstraint;

btPoint2PointConstraint.prototype["setPivotA"] = btPoint2PointConstraint.prototype.setPivotA = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btPoint2PointConstraint_setPivotA_1(self, arg0);
};

btPoint2PointConstraint.prototype["setPivotB"] = btPoint2PointConstraint.prototype.setPivotB = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btPoint2PointConstraint_setPivotB_1(self, arg0);
};

btPoint2PointConstraint.prototype["getPivotInA"] = btPoint2PointConstraint.prototype.getPivotInA = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btPoint2PointConstraint_getPivotInA_0(self), btVector3);
};

btPoint2PointConstraint.prototype["getPivotInB"] = btPoint2PointConstraint.prototype.getPivotInB = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btPoint2PointConstraint_getPivotInB_0(self), btVector3);
};

btPoint2PointConstraint.prototype["enableFeedback"] = btPoint2PointConstraint.prototype.enableFeedback = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btPoint2PointConstraint_enableFeedback_1(self, arg0);
};

btPoint2PointConstraint.prototype["getBreakingImpulseThreshold"] = btPoint2PointConstraint.prototype.getBreakingImpulseThreshold = function() {
 var self = this.ptr;
 return _emscripten_bind_btPoint2PointConstraint_getBreakingImpulseThreshold_0(self);
};

btPoint2PointConstraint.prototype["setBreakingImpulseThreshold"] = btPoint2PointConstraint.prototype.setBreakingImpulseThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btPoint2PointConstraint_setBreakingImpulseThreshold_1(self, arg0);
};

btPoint2PointConstraint.prototype["getParam"] = btPoint2PointConstraint.prototype.getParam = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 return _emscripten_bind_btPoint2PointConstraint_getParam_2(self, arg0, arg1);
};

btPoint2PointConstraint.prototype["setParam"] = btPoint2PointConstraint.prototype.setParam = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 _emscripten_bind_btPoint2PointConstraint_setParam_3(self, arg0, arg1, arg2);
};

btPoint2PointConstraint.prototype["get_m_setting"] = btPoint2PointConstraint.prototype.get_m_setting = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btPoint2PointConstraint_get_m_setting_0(self), btConstraintSetting);
};

btPoint2PointConstraint.prototype["set_m_setting"] = btPoint2PointConstraint.prototype.set_m_setting = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btPoint2PointConstraint_set_m_setting_1(self, arg0);
};

Object.defineProperty(btPoint2PointConstraint.prototype, "m_setting", {
 get: btPoint2PointConstraint.prototype.get_m_setting,
 set: btPoint2PointConstraint.prototype.set_m_setting
});

btPoint2PointConstraint.prototype["__destroy__"] = btPoint2PointConstraint.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btPoint2PointConstraint___destroy___0(self);
};

function VoidPtr() {
 throw "cannot construct a VoidPtr, no constructor in IDL";
}

VoidPtr.prototype = Object.create(WrapperObject.prototype);

VoidPtr.prototype.constructor = VoidPtr;

VoidPtr.prototype.__class__ = VoidPtr;

VoidPtr.__cache__ = {};

Module["VoidPtr"] = VoidPtr;

VoidPtr.prototype["__destroy__"] = VoidPtr.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_VoidPtr___destroy___0(self);
};

function btBroadphaseProxy() {
 throw "cannot construct a btBroadphaseProxy, no constructor in IDL";
}

btBroadphaseProxy.prototype = Object.create(WrapperObject.prototype);

btBroadphaseProxy.prototype.constructor = btBroadphaseProxy;

btBroadphaseProxy.prototype.__class__ = btBroadphaseProxy;

btBroadphaseProxy.__cache__ = {};

Module["btBroadphaseProxy"] = btBroadphaseProxy;

btBroadphaseProxy.prototype["get_m_collisionFilterGroup"] = btBroadphaseProxy.prototype.get_m_collisionFilterGroup = function() {
 var self = this.ptr;
 return _emscripten_bind_btBroadphaseProxy_get_m_collisionFilterGroup_0(self);
};

btBroadphaseProxy.prototype["set_m_collisionFilterGroup"] = btBroadphaseProxy.prototype.set_m_collisionFilterGroup = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btBroadphaseProxy_set_m_collisionFilterGroup_1(self, arg0);
};

Object.defineProperty(btBroadphaseProxy.prototype, "m_collisionFilterGroup", {
 get: btBroadphaseProxy.prototype.get_m_collisionFilterGroup,
 set: btBroadphaseProxy.prototype.set_m_collisionFilterGroup
});

btBroadphaseProxy.prototype["get_m_collisionFilterMask"] = btBroadphaseProxy.prototype.get_m_collisionFilterMask = function() {
 var self = this.ptr;
 return _emscripten_bind_btBroadphaseProxy_get_m_collisionFilterMask_0(self);
};

btBroadphaseProxy.prototype["set_m_collisionFilterMask"] = btBroadphaseProxy.prototype.set_m_collisionFilterMask = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btBroadphaseProxy_set_m_collisionFilterMask_1(self, arg0);
};

Object.defineProperty(btBroadphaseProxy.prototype, "m_collisionFilterMask", {
 get: btBroadphaseProxy.prototype.get_m_collisionFilterMask,
 set: btBroadphaseProxy.prototype.set_m_collisionFilterMask
});

btBroadphaseProxy.prototype["__destroy__"] = btBroadphaseProxy.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btBroadphaseProxy___destroy___0(self);
};

function btBoxShape(arg0) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 this.ptr = _emscripten_bind_btBoxShape_btBoxShape_1(arg0);
 getCache(btBoxShape)[this.ptr] = this;
}

btBoxShape.prototype = Object.create(btCollisionShape.prototype);

btBoxShape.prototype.constructor = btBoxShape;

btBoxShape.prototype.__class__ = btBoxShape;

btBoxShape.__cache__ = {};

Module["btBoxShape"] = btBoxShape;

btBoxShape.prototype["setMargin"] = btBoxShape.prototype.setMargin = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btBoxShape_setMargin_1(self, arg0);
};

btBoxShape.prototype["getMargin"] = btBoxShape.prototype.getMargin = function() {
 var self = this.ptr;
 return _emscripten_bind_btBoxShape_getMargin_0(self);
};

btBoxShape.prototype["setLocalScaling"] = btBoxShape.prototype.setLocalScaling = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btBoxShape_setLocalScaling_1(self, arg0);
};

btBoxShape.prototype["getLocalScaling"] = btBoxShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btBoxShape_getLocalScaling_0(self), btVector3);
};

btBoxShape.prototype["calculateLocalInertia"] = btBoxShape.prototype.calculateLocalInertia = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btBoxShape_calculateLocalInertia_2(self, arg0, arg1);
};

btBoxShape.prototype["__destroy__"] = btBoxShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btBoxShape___destroy___0(self);
};

function btFace() {
 throw "cannot construct a btFace, no constructor in IDL";
}

btFace.prototype = Object.create(WrapperObject.prototype);

btFace.prototype.constructor = btFace;

btFace.prototype.__class__ = btFace;

btFace.__cache__ = {};

Module["btFace"] = btFace;

btFace.prototype["get_m_indices"] = btFace.prototype.get_m_indices = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btFace_get_m_indices_0(self), btIntArray);
};

btFace.prototype["set_m_indices"] = btFace.prototype.set_m_indices = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btFace_set_m_indices_1(self, arg0);
};

Object.defineProperty(btFace.prototype, "m_indices", {
 get: btFace.prototype.get_m_indices,
 set: btFace.prototype.set_m_indices
});

btFace.prototype["get_m_plane"] = btFace.prototype.get_m_plane = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return _emscripten_bind_btFace_get_m_plane_1(self, arg0);
};

btFace.prototype["set_m_plane"] = btFace.prototype.set_m_plane = function(arg0, arg1) {
 var self = this.ptr;
 ensureCache.prepare();
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btFace_set_m_plane_2(self, arg0, arg1);
};

Object.defineProperty(btFace.prototype, "m_plane", {
 get: btFace.prototype.get_m_plane,
 set: btFace.prototype.set_m_plane
});

btFace.prototype["__destroy__"] = btFace.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btFace___destroy___0(self);
};

function DebugDrawer() {
 this.ptr = _emscripten_bind_DebugDrawer_DebugDrawer_0();
 getCache(DebugDrawer)[this.ptr] = this;
}

DebugDrawer.prototype = Object.create(btIDebugDraw.prototype);

DebugDrawer.prototype.constructor = DebugDrawer;

DebugDrawer.prototype.__class__ = DebugDrawer;

DebugDrawer.__cache__ = {};

Module["DebugDrawer"] = DebugDrawer;

DebugDrawer.prototype["drawLine"] = DebugDrawer.prototype.drawLine = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 _emscripten_bind_DebugDrawer_drawLine_3(self, arg0, arg1, arg2);
};

DebugDrawer.prototype["drawContactPoint"] = DebugDrawer.prototype.drawContactPoint = function(arg0, arg1, arg2, arg3, arg4) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 if (arg4 && typeof arg4 === "object") arg4 = arg4.ptr;
 _emscripten_bind_DebugDrawer_drawContactPoint_5(self, arg0, arg1, arg2, arg3, arg4);
};

DebugDrawer.prototype["reportErrorWarning"] = DebugDrawer.prototype.reportErrorWarning = function(arg0) {
 var self = this.ptr;
 ensureCache.prepare();
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr; else arg0 = ensureString(arg0);
 _emscripten_bind_DebugDrawer_reportErrorWarning_1(self, arg0);
};

DebugDrawer.prototype["draw3dText"] = DebugDrawer.prototype.draw3dText = function(arg0, arg1) {
 var self = this.ptr;
 ensureCache.prepare();
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr; else arg1 = ensureString(arg1);
 _emscripten_bind_DebugDrawer_draw3dText_2(self, arg0, arg1);
};

DebugDrawer.prototype["setDebugMode"] = DebugDrawer.prototype.setDebugMode = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_DebugDrawer_setDebugMode_1(self, arg0);
};

DebugDrawer.prototype["getDebugMode"] = DebugDrawer.prototype.getDebugMode = function() {
 var self = this.ptr;
 return _emscripten_bind_DebugDrawer_getDebugMode_0(self);
};

DebugDrawer.prototype["__destroy__"] = DebugDrawer.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_DebugDrawer___destroy___0(self);
};

function btCapsuleShapeX(arg0, arg1) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 this.ptr = _emscripten_bind_btCapsuleShapeX_btCapsuleShapeX_2(arg0, arg1);
 getCache(btCapsuleShapeX)[this.ptr] = this;
}

btCapsuleShapeX.prototype = Object.create(btCapsuleShape.prototype);

btCapsuleShapeX.prototype.constructor = btCapsuleShapeX;

btCapsuleShapeX.prototype.__class__ = btCapsuleShapeX;

btCapsuleShapeX.__cache__ = {};

Module["btCapsuleShapeX"] = btCapsuleShapeX;

btCapsuleShapeX.prototype["setMargin"] = btCapsuleShapeX.prototype.setMargin = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCapsuleShapeX_setMargin_1(self, arg0);
};

btCapsuleShapeX.prototype["getMargin"] = btCapsuleShapeX.prototype.getMargin = function() {
 var self = this.ptr;
 return _emscripten_bind_btCapsuleShapeX_getMargin_0(self);
};

btCapsuleShapeX.prototype["getUpAxis"] = btCapsuleShapeX.prototype.getUpAxis = function() {
 var self = this.ptr;
 return _emscripten_bind_btCapsuleShapeX_getUpAxis_0(self);
};

btCapsuleShapeX.prototype["getRadius"] = btCapsuleShapeX.prototype.getRadius = function() {
 var self = this.ptr;
 return _emscripten_bind_btCapsuleShapeX_getRadius_0(self);
};

btCapsuleShapeX.prototype["getHalfHeight"] = btCapsuleShapeX.prototype.getHalfHeight = function() {
 var self = this.ptr;
 return _emscripten_bind_btCapsuleShapeX_getHalfHeight_0(self);
};

btCapsuleShapeX.prototype["setLocalScaling"] = btCapsuleShapeX.prototype.setLocalScaling = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCapsuleShapeX_setLocalScaling_1(self, arg0);
};

btCapsuleShapeX.prototype["getLocalScaling"] = btCapsuleShapeX.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCapsuleShapeX_getLocalScaling_0(self), btVector3);
};

btCapsuleShapeX.prototype["calculateLocalInertia"] = btCapsuleShapeX.prototype.calculateLocalInertia = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btCapsuleShapeX_calculateLocalInertia_2(self, arg0, arg1);
};

btCapsuleShapeX.prototype["__destroy__"] = btCapsuleShapeX.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCapsuleShapeX___destroy___0(self);
};

function btQuaternion(arg0, arg1, arg2, arg3) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 this.ptr = _emscripten_bind_btQuaternion_btQuaternion_4(arg0, arg1, arg2, arg3);
 getCache(btQuaternion)[this.ptr] = this;
}

btQuaternion.prototype = Object.create(btQuadWord.prototype);

btQuaternion.prototype.constructor = btQuaternion;

btQuaternion.prototype.__class__ = btQuaternion;

btQuaternion.__cache__ = {};

Module["btQuaternion"] = btQuaternion;

btQuaternion.prototype["setValue"] = btQuaternion.prototype.setValue = function(arg0, arg1, arg2, arg3) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 _emscripten_bind_btQuaternion_setValue_4(self, arg0, arg1, arg2, arg3);
};

btQuaternion.prototype["setEulerZYX"] = btQuaternion.prototype.setEulerZYX = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 _emscripten_bind_btQuaternion_setEulerZYX_3(self, arg0, arg1, arg2);
};

btQuaternion.prototype["setRotation"] = btQuaternion.prototype.setRotation = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btQuaternion_setRotation_2(self, arg0, arg1);
};

btQuaternion.prototype["normalize"] = btQuaternion.prototype.normalize = function() {
 var self = this.ptr;
 _emscripten_bind_btQuaternion_normalize_0(self);
};

btQuaternion.prototype["length2"] = btQuaternion.prototype.length2 = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuaternion_length2_0(self);
};

btQuaternion.prototype["length"] = btQuaternion.prototype.length = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuaternion_length_0(self);
};

btQuaternion.prototype["dot"] = btQuaternion.prototype.dot = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return _emscripten_bind_btQuaternion_dot_1(self, arg0);
};

btQuaternion.prototype["normalized"] = btQuaternion.prototype.normalized = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btQuaternion_normalized_0(self), btQuaternion);
};

btQuaternion.prototype["getAxis"] = btQuaternion.prototype.getAxis = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btQuaternion_getAxis_0(self), btVector3);
};

btQuaternion.prototype["inverse"] = btQuaternion.prototype.inverse = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btQuaternion_inverse_0(self), btQuaternion);
};

btQuaternion.prototype["getAngle"] = btQuaternion.prototype.getAngle = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuaternion_getAngle_0(self);
};

btQuaternion.prototype["getAngleShortestPath"] = btQuaternion.prototype.getAngleShortestPath = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuaternion_getAngleShortestPath_0(self);
};

btQuaternion.prototype["angle"] = btQuaternion.prototype.angle = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return _emscripten_bind_btQuaternion_angle_1(self, arg0);
};

btQuaternion.prototype["angleShortestPath"] = btQuaternion.prototype.angleShortestPath = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return _emscripten_bind_btQuaternion_angleShortestPath_1(self, arg0);
};

btQuaternion.prototype["op_add"] = btQuaternion.prototype.op_add = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return wrapPointer(_emscripten_bind_btQuaternion_op_add_1(self, arg0), btQuaternion);
};

btQuaternion.prototype["op_sub"] = btQuaternion.prototype.op_sub = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return wrapPointer(_emscripten_bind_btQuaternion_op_sub_1(self, arg0), btQuaternion);
};

btQuaternion.prototype["op_mul"] = btQuaternion.prototype.op_mul = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return wrapPointer(_emscripten_bind_btQuaternion_op_mul_1(self, arg0), btQuaternion);
};

btQuaternion.prototype["op_mulq"] = btQuaternion.prototype.op_mulq = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return wrapPointer(_emscripten_bind_btQuaternion_op_mulq_1(self, arg0), btQuaternion);
};

btQuaternion.prototype["op_div"] = btQuaternion.prototype.op_div = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 return wrapPointer(_emscripten_bind_btQuaternion_op_div_1(self, arg0), btQuaternion);
};

btQuaternion.prototype["x"] = btQuaternion.prototype.x = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuaternion_x_0(self);
};

btQuaternion.prototype["y"] = btQuaternion.prototype.y = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuaternion_y_0(self);
};

btQuaternion.prototype["z"] = btQuaternion.prototype.z = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuaternion_z_0(self);
};

btQuaternion.prototype["w"] = btQuaternion.prototype.w = function() {
 var self = this.ptr;
 return _emscripten_bind_btQuaternion_w_0(self);
};

btQuaternion.prototype["setX"] = btQuaternion.prototype.setX = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btQuaternion_setX_1(self, arg0);
};

btQuaternion.prototype["setY"] = btQuaternion.prototype.setY = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btQuaternion_setY_1(self, arg0);
};

btQuaternion.prototype["setZ"] = btQuaternion.prototype.setZ = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btQuaternion_setZ_1(self, arg0);
};

btQuaternion.prototype["setW"] = btQuaternion.prototype.setW = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btQuaternion_setW_1(self, arg0);
};

btQuaternion.prototype["__destroy__"] = btQuaternion.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btQuaternion___destroy___0(self);
};

function btCapsuleShapeZ(arg0, arg1) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 this.ptr = _emscripten_bind_btCapsuleShapeZ_btCapsuleShapeZ_2(arg0, arg1);
 getCache(btCapsuleShapeZ)[this.ptr] = this;
}

btCapsuleShapeZ.prototype = Object.create(btCapsuleShape.prototype);

btCapsuleShapeZ.prototype.constructor = btCapsuleShapeZ;

btCapsuleShapeZ.prototype.__class__ = btCapsuleShapeZ;

btCapsuleShapeZ.__cache__ = {};

Module["btCapsuleShapeZ"] = btCapsuleShapeZ;

btCapsuleShapeZ.prototype["setMargin"] = btCapsuleShapeZ.prototype.setMargin = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCapsuleShapeZ_setMargin_1(self, arg0);
};

btCapsuleShapeZ.prototype["getMargin"] = btCapsuleShapeZ.prototype.getMargin = function() {
 var self = this.ptr;
 return _emscripten_bind_btCapsuleShapeZ_getMargin_0(self);
};

btCapsuleShapeZ.prototype["getUpAxis"] = btCapsuleShapeZ.prototype.getUpAxis = function() {
 var self = this.ptr;
 return _emscripten_bind_btCapsuleShapeZ_getUpAxis_0(self);
};

btCapsuleShapeZ.prototype["getRadius"] = btCapsuleShapeZ.prototype.getRadius = function() {
 var self = this.ptr;
 return _emscripten_bind_btCapsuleShapeZ_getRadius_0(self);
};

btCapsuleShapeZ.prototype["getHalfHeight"] = btCapsuleShapeZ.prototype.getHalfHeight = function() {
 var self = this.ptr;
 return _emscripten_bind_btCapsuleShapeZ_getHalfHeight_0(self);
};

btCapsuleShapeZ.prototype["setLocalScaling"] = btCapsuleShapeZ.prototype.setLocalScaling = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btCapsuleShapeZ_setLocalScaling_1(self, arg0);
};

btCapsuleShapeZ.prototype["getLocalScaling"] = btCapsuleShapeZ.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btCapsuleShapeZ_getLocalScaling_0(self), btVector3);
};

btCapsuleShapeZ.prototype["calculateLocalInertia"] = btCapsuleShapeZ.prototype.calculateLocalInertia = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btCapsuleShapeZ_calculateLocalInertia_2(self, arg0, arg1);
};

btCapsuleShapeZ.prototype["__destroy__"] = btCapsuleShapeZ.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btCapsuleShapeZ___destroy___0(self);
};

function btContactSolverInfo() {
 throw "cannot construct a btContactSolverInfo, no constructor in IDL";
}

btContactSolverInfo.prototype = Object.create(WrapperObject.prototype);

btContactSolverInfo.prototype.constructor = btContactSolverInfo;

btContactSolverInfo.prototype.__class__ = btContactSolverInfo;

btContactSolverInfo.__cache__ = {};

Module["btContactSolverInfo"] = btContactSolverInfo;

btContactSolverInfo.prototype["get_m_splitImpulse"] = btContactSolverInfo.prototype.get_m_splitImpulse = function() {
 var self = this.ptr;
 return !!_emscripten_bind_btContactSolverInfo_get_m_splitImpulse_0(self);
};

btContactSolverInfo.prototype["set_m_splitImpulse"] = btContactSolverInfo.prototype.set_m_splitImpulse = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btContactSolverInfo_set_m_splitImpulse_1(self, arg0);
};

Object.defineProperty(btContactSolverInfo.prototype, "m_splitImpulse", {
 get: btContactSolverInfo.prototype.get_m_splitImpulse,
 set: btContactSolverInfo.prototype.set_m_splitImpulse
});

btContactSolverInfo.prototype["get_m_splitImpulsePenetrationThreshold"] = btContactSolverInfo.prototype.get_m_splitImpulsePenetrationThreshold = function() {
 var self = this.ptr;
 return _emscripten_bind_btContactSolverInfo_get_m_splitImpulsePenetrationThreshold_0(self);
};

btContactSolverInfo.prototype["set_m_splitImpulsePenetrationThreshold"] = btContactSolverInfo.prototype.set_m_splitImpulsePenetrationThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btContactSolverInfo_set_m_splitImpulsePenetrationThreshold_1(self, arg0);
};

Object.defineProperty(btContactSolverInfo.prototype, "m_splitImpulsePenetrationThreshold", {
 get: btContactSolverInfo.prototype.get_m_splitImpulsePenetrationThreshold,
 set: btContactSolverInfo.prototype.set_m_splitImpulsePenetrationThreshold
});

btContactSolverInfo.prototype["get_m_numIterations"] = btContactSolverInfo.prototype.get_m_numIterations = function() {
 var self = this.ptr;
 return _emscripten_bind_btContactSolverInfo_get_m_numIterations_0(self);
};

btContactSolverInfo.prototype["set_m_numIterations"] = btContactSolverInfo.prototype.set_m_numIterations = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btContactSolverInfo_set_m_numIterations_1(self, arg0);
};

Object.defineProperty(btContactSolverInfo.prototype, "m_numIterations", {
 get: btContactSolverInfo.prototype.get_m_numIterations,
 set: btContactSolverInfo.prototype.set_m_numIterations
});

btContactSolverInfo.prototype["__destroy__"] = btContactSolverInfo.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btContactSolverInfo___destroy___0(self);
};

function btGeneric6DofSpringConstraint(arg0, arg1, arg2, arg3, arg4) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 if (arg4 && typeof arg4 === "object") arg4 = arg4.ptr;
 if (arg3 === undefined) {
  this.ptr = _emscripten_bind_btGeneric6DofSpringConstraint_btGeneric6DofSpringConstraint_3(arg0, arg1, arg2);
  getCache(btGeneric6DofSpringConstraint)[this.ptr] = this;
  return;
 }
 if (arg4 === undefined) {
  this.ptr = _emscripten_bind_btGeneric6DofSpringConstraint_btGeneric6DofSpringConstraint_4(arg0, arg1, arg2, arg3);
  getCache(btGeneric6DofSpringConstraint)[this.ptr] = this;
  return;
 }
 this.ptr = _emscripten_bind_btGeneric6DofSpringConstraint_btGeneric6DofSpringConstraint_5(arg0, arg1, arg2, arg3, arg4);
 getCache(btGeneric6DofSpringConstraint)[this.ptr] = this;
}

btGeneric6DofSpringConstraint.prototype = Object.create(btGeneric6DofConstraint.prototype);

btGeneric6DofSpringConstraint.prototype.constructor = btGeneric6DofSpringConstraint;

btGeneric6DofSpringConstraint.prototype.__class__ = btGeneric6DofSpringConstraint;

btGeneric6DofSpringConstraint.__cache__ = {};

Module["btGeneric6DofSpringConstraint"] = btGeneric6DofSpringConstraint;

btGeneric6DofSpringConstraint.prototype["enableSpring"] = btGeneric6DofSpringConstraint.prototype.enableSpring = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btGeneric6DofSpringConstraint_enableSpring_2(self, arg0, arg1);
};

btGeneric6DofSpringConstraint.prototype["setStiffness"] = btGeneric6DofSpringConstraint.prototype.setStiffness = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btGeneric6DofSpringConstraint_setStiffness_2(self, arg0, arg1);
};

btGeneric6DofSpringConstraint.prototype["setDamping"] = btGeneric6DofSpringConstraint.prototype.setDamping = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btGeneric6DofSpringConstraint_setDamping_2(self, arg0, arg1);
};

btGeneric6DofSpringConstraint.prototype["setLinearLowerLimit"] = btGeneric6DofSpringConstraint.prototype.setLinearLowerLimit = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGeneric6DofSpringConstraint_setLinearLowerLimit_1(self, arg0);
};

btGeneric6DofSpringConstraint.prototype["setLinearUpperLimit"] = btGeneric6DofSpringConstraint.prototype.setLinearUpperLimit = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGeneric6DofSpringConstraint_setLinearUpperLimit_1(self, arg0);
};

btGeneric6DofSpringConstraint.prototype["setAngularLowerLimit"] = btGeneric6DofSpringConstraint.prototype.setAngularLowerLimit = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGeneric6DofSpringConstraint_setAngularLowerLimit_1(self, arg0);
};

btGeneric6DofSpringConstraint.prototype["setAngularUpperLimit"] = btGeneric6DofSpringConstraint.prototype.setAngularUpperLimit = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGeneric6DofSpringConstraint_setAngularUpperLimit_1(self, arg0);
};

btGeneric6DofSpringConstraint.prototype["getFrameOffsetA"] = btGeneric6DofSpringConstraint.prototype.getFrameOffsetA = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btGeneric6DofSpringConstraint_getFrameOffsetA_0(self), btTransform);
};

btGeneric6DofSpringConstraint.prototype["enableFeedback"] = btGeneric6DofSpringConstraint.prototype.enableFeedback = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGeneric6DofSpringConstraint_enableFeedback_1(self, arg0);
};

btGeneric6DofSpringConstraint.prototype["getBreakingImpulseThreshold"] = btGeneric6DofSpringConstraint.prototype.getBreakingImpulseThreshold = function() {
 var self = this.ptr;
 return _emscripten_bind_btGeneric6DofSpringConstraint_getBreakingImpulseThreshold_0(self);
};

btGeneric6DofSpringConstraint.prototype["setBreakingImpulseThreshold"] = btGeneric6DofSpringConstraint.prototype.setBreakingImpulseThreshold = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btGeneric6DofSpringConstraint_setBreakingImpulseThreshold_1(self, arg0);
};

btGeneric6DofSpringConstraint.prototype["getParam"] = btGeneric6DofSpringConstraint.prototype.getParam = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 return _emscripten_bind_btGeneric6DofSpringConstraint_getParam_2(self, arg0, arg1);
};

btGeneric6DofSpringConstraint.prototype["setParam"] = btGeneric6DofSpringConstraint.prototype.setParam = function(arg0, arg1, arg2) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 _emscripten_bind_btGeneric6DofSpringConstraint_setParam_3(self, arg0, arg1, arg2);
};

btGeneric6DofSpringConstraint.prototype["__destroy__"] = btGeneric6DofSpringConstraint.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btGeneric6DofSpringConstraint___destroy___0(self);
};

function btSphereShape(arg0) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 this.ptr = _emscripten_bind_btSphereShape_btSphereShape_1(arg0);
 getCache(btSphereShape)[this.ptr] = this;
}

btSphereShape.prototype = Object.create(btCollisionShape.prototype);

btSphereShape.prototype.constructor = btSphereShape;

btSphereShape.prototype.__class__ = btSphereShape;

btSphereShape.__cache__ = {};

Module["btSphereShape"] = btSphereShape;

btSphereShape.prototype["setMargin"] = btSphereShape.prototype.setMargin = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btSphereShape_setMargin_1(self, arg0);
};

btSphereShape.prototype["getMargin"] = btSphereShape.prototype.getMargin = function() {
 var self = this.ptr;
 return _emscripten_bind_btSphereShape_getMargin_0(self);
};

btSphereShape.prototype["setLocalScaling"] = btSphereShape.prototype.setLocalScaling = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_btSphereShape_setLocalScaling_1(self, arg0);
};

btSphereShape.prototype["getLocalScaling"] = btSphereShape.prototype.getLocalScaling = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_btSphereShape_getLocalScaling_0(self), btVector3);
};

btSphereShape.prototype["calculateLocalInertia"] = btSphereShape.prototype.calculateLocalInertia = function(arg0, arg1) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 _emscripten_bind_btSphereShape_calculateLocalInertia_2(self, arg0, arg1);
};

btSphereShape.prototype["__destroy__"] = btSphereShape.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_btSphereShape___destroy___0(self);
};

function LocalConvexResult(arg0, arg1, arg2, arg3, arg4) {
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 if (arg1 && typeof arg1 === "object") arg1 = arg1.ptr;
 if (arg2 && typeof arg2 === "object") arg2 = arg2.ptr;
 if (arg3 && typeof arg3 === "object") arg3 = arg3.ptr;
 if (arg4 && typeof arg4 === "object") arg4 = arg4.ptr;
 this.ptr = _emscripten_bind_LocalConvexResult_LocalConvexResult_5(arg0, arg1, arg2, arg3, arg4);
 getCache(LocalConvexResult)[this.ptr] = this;
}

LocalConvexResult.prototype = Object.create(WrapperObject.prototype);

LocalConvexResult.prototype.constructor = LocalConvexResult;

LocalConvexResult.prototype.__class__ = LocalConvexResult;

LocalConvexResult.__cache__ = {};

Module["LocalConvexResult"] = LocalConvexResult;

LocalConvexResult.prototype["get_m_hitCollisionObject"] = LocalConvexResult.prototype.get_m_hitCollisionObject = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_LocalConvexResult_get_m_hitCollisionObject_0(self), btCollisionObject);
};

LocalConvexResult.prototype["set_m_hitCollisionObject"] = LocalConvexResult.prototype.set_m_hitCollisionObject = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_LocalConvexResult_set_m_hitCollisionObject_1(self, arg0);
};

Object.defineProperty(LocalConvexResult.prototype, "m_hitCollisionObject", {
 get: LocalConvexResult.prototype.get_m_hitCollisionObject,
 set: LocalConvexResult.prototype.set_m_hitCollisionObject
});

LocalConvexResult.prototype["get_m_localShapeInfo"] = LocalConvexResult.prototype.get_m_localShapeInfo = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_LocalConvexResult_get_m_localShapeInfo_0(self), LocalShapeInfo);
};

LocalConvexResult.prototype["set_m_localShapeInfo"] = LocalConvexResult.prototype.set_m_localShapeInfo = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_LocalConvexResult_set_m_localShapeInfo_1(self, arg0);
};

Object.defineProperty(LocalConvexResult.prototype, "m_localShapeInfo", {
 get: LocalConvexResult.prototype.get_m_localShapeInfo,
 set: LocalConvexResult.prototype.set_m_localShapeInfo
});

LocalConvexResult.prototype["get_m_hitNormalLocal"] = LocalConvexResult.prototype.get_m_hitNormalLocal = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_LocalConvexResult_get_m_hitNormalLocal_0(self), btVector3);
};

LocalConvexResult.prototype["set_m_hitNormalLocal"] = LocalConvexResult.prototype.set_m_hitNormalLocal = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_LocalConvexResult_set_m_hitNormalLocal_1(self, arg0);
};

Object.defineProperty(LocalConvexResult.prototype, "m_hitNormalLocal", {
 get: LocalConvexResult.prototype.get_m_hitNormalLocal,
 set: LocalConvexResult.prototype.set_m_hitNormalLocal
});

LocalConvexResult.prototype["get_m_hitPointLocal"] = LocalConvexResult.prototype.get_m_hitPointLocal = function() {
 var self = this.ptr;
 return wrapPointer(_emscripten_bind_LocalConvexResult_get_m_hitPointLocal_0(self), btVector3);
};

LocalConvexResult.prototype["set_m_hitPointLocal"] = LocalConvexResult.prototype.set_m_hitPointLocal = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_LocalConvexResult_set_m_hitPointLocal_1(self, arg0);
};

Object.defineProperty(LocalConvexResult.prototype, "m_hitPointLocal", {
 get: LocalConvexResult.prototype.get_m_hitPointLocal,
 set: LocalConvexResult.prototype.set_m_hitPointLocal
});

LocalConvexResult.prototype["get_m_hitFraction"] = LocalConvexResult.prototype.get_m_hitFraction = function() {
 var self = this.ptr;
 return _emscripten_bind_LocalConvexResult_get_m_hitFraction_0(self);
};

LocalConvexResult.prototype["set_m_hitFraction"] = LocalConvexResult.prototype.set_m_hitFraction = function(arg0) {
 var self = this.ptr;
 if (arg0 && typeof arg0 === "object") arg0 = arg0.ptr;
 _emscripten_bind_LocalConvexResult_set_m_hitFraction_1(self, arg0);
};

Object.defineProperty(LocalConvexResult.prototype, "m_hitFraction", {
 get: LocalConvexResult.prototype.get_m_hitFraction,
 set: LocalConvexResult.prototype.set_m_hitFraction
});

LocalConvexResult.prototype["__destroy__"] = LocalConvexResult.prototype.__destroy__ = function() {
 var self = this.ptr;
 _emscripten_bind_LocalConvexResult___destroy___0(self);
};

(function() {
 function setupEnums() {
  Module["BT_CONSTRAINT_ERP"] = _emscripten_enum_btConstraintParams_BT_CONSTRAINT_ERP();
  Module["BT_CONSTRAINT_STOP_ERP"] = _emscripten_enum_btConstraintParams_BT_CONSTRAINT_STOP_ERP();
  Module["BT_CONSTRAINT_CFM"] = _emscripten_enum_btConstraintParams_BT_CONSTRAINT_CFM();
  Module["BT_CONSTRAINT_STOP_CFM"] = _emscripten_enum_btConstraintParams_BT_CONSTRAINT_STOP_CFM();
  Module["PHY_FLOAT"] = _emscripten_enum_PHY_ScalarType_PHY_FLOAT();
  Module["PHY_DOUBLE"] = _emscripten_enum_PHY_ScalarType_PHY_DOUBLE();
  Module["PHY_INTEGER"] = _emscripten_enum_PHY_ScalarType_PHY_INTEGER();
  Module["PHY_SHORT"] = _emscripten_enum_PHY_ScalarType_PHY_SHORT();
  Module["PHY_FIXEDPOINT88"] = _emscripten_enum_PHY_ScalarType_PHY_FIXEDPOINT88();
  Module["PHY_UCHAR"] = _emscripten_enum_PHY_ScalarType_PHY_UCHAR();
 }
 if (Module["calledRun"]) setupEnums(); else addOnPreMain(setupEnums);
})();

this["Ammo"] = Module;


  return Ammo;
}
);
})();
if (typeof exports === 'object' && typeof module === 'object')
      module.exports = Ammo;
    else if (typeof define === 'function' && define['amd'])
      define([], function() { return Ammo; });
    else if (typeof exports === 'object')
      exports["Ammo"] = Ammo;
    