pub fn webview_init_script() -> &'static str {
    r#"
(function () {
  function toInteger(value) {
    var number = Number(value);
    if (number !== number || number === 0) return 0;
    if (!isFinite(number)) return number;
    return number < 0 ? Math.ceil(number) : Math.floor(number);
  }

  function at(index) {
    var object = Object(this);
    var length = object.length >>> 0;
    var relativeIndex = toInteger(index);
    var targetIndex = relativeIndex >= 0 ? relativeIndex : length + relativeIndex;
    if (targetIndex < 0 || targetIndex >= length) return undefined;
    return object[targetIndex];
  }

  function defineAt(target, implementation) {
    if (!target || typeof target.at === 'function') return;
    Object.defineProperty(target, 'at', {
      configurable: true,
      writable: true,
      value: implementation
    });
  }

  defineAt(Array.prototype, at);
  defineAt(String.prototype, function (index) {
    var value = String(this);
    var relativeIndex = toInteger(index);
    var targetIndex = relativeIndex >= 0 ? relativeIndex : value.length + relativeIndex;
    if (targetIndex < 0 || targetIndex >= value.length) return undefined;
    return value.charAt(targetIndex);
  });

  var typedArrays = [
    'Int8Array',
    'Uint8Array',
    'Uint8ClampedArray',
    'Int16Array',
    'Uint16Array',
    'Int32Array',
    'Uint32Array',
    'Float32Array',
    'Float64Array',
    'BigInt64Array',
    'BigUint64Array'
  ];

  for (var i = 0; i < typedArrays.length; i += 1) {
    var constructor = window[typedArrays[i]];
    if (constructor && constructor.prototype) {
      defineAt(constructor.prototype, at);
    }
  }
}());
"#
}
