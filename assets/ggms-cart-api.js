/* assets/ggms-cart-api.js */
(() => {
  const GGMS = (window.GGMS = window.GGMS || {});
  if (GGMS.cart) return;

  const defaults = {
    endpoints: {
      get: "/cart.js",
      add: "/cart/add.js",
      change: "/cart/change.js",
      update: "/cart/update.js",
      clear: "/cart/clear.js",
    },
    events: {
      updated: "ggms:cart:updated",
      error: "ggms:cart:error",
    },
  };

  let queue = Promise.resolve();

  const isPlainObject = (v) => Object.prototype.toString.call(v) === "[object Object]";
  const isNumber = (v) => typeof v === "number" && Number.isFinite(v);
  const toInt = (v) => {
    const n = typeof v === "string" ? parseInt(v, 10) : v;
    return Number.isFinite(n) ? n : null;
  };

  const emit = (name, detail) => {
    try {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    } catch (_) {}
  };

  const encodeForm = (data) => {
    const p = new URLSearchParams();
    const append = (k, v) => {
      if (v === undefined || v === null) return;
      if (Array.isArray(v)) {
        v.forEach((vv) => append(`${k}[]`, vv));
        return;
      }
      if (isPlainObject(v)) {
        Object.keys(v).forEach((kk) => append(`${k}[${kk}]`, v[kk]));
        return;
      }
      p.append(k, String(v));
    };
    Object.keys(data || {}).forEach((k) => append(k, data[k]));
    return p;
  };

  const fetchJSON = async (url, opts = {}) => {
    const res = await fetch(url, {
      credentials: "same-origin",
      ...opts,
      headers: {
        Accept: "application/json",
        ...(opts.headers || {}),
      },
    });

    const ct = res.headers.get("content-type") || "";
    const isJson = ct.includes("application/json");
    const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

    if (!res.ok) {
      const err = new Error("Cart request failed");
      err.status = res.status;
      err.payload = payload;
      throw err;
    }

    return payload;
  };

  const post = async (url, data) => {
    try {
      return await fetchJSON(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data || {}),
      });
    } catch (e) {
      return await fetchJSON(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: encodeForm(data || {}),
      });
    }
  };

  const runQueued = (fn) => {
    const task = queue.then(fn);
    queue = task.catch(() => {});
    return task;
  };

  const api = {
    config: { ...defaults },

    get: () => fetchJSON(defaults.endpoints.get),

    add: (input, options = {}) =>
      runQueued(async () => {
        const body = Array.isArray(input) ? { items: input } : input;
        const added = await post(defaults.endpoints.add, body);
        const cart = options.skipCartFetch ? null : await api.get();
        if (cart) emit(defaults.events.updated, { cart, action: "add", added });
        return options.skipCartFetch ? added : cart;
      }),

    change: (params, options = {}) =>
      runQueued(async () => {
        const data = { ...params };
        if (data.quantity === undefined) data.quantity = 1;

        const hasLine = data.line !== undefined && data.line !== null;
        const hasId = data.id !== undefined && data.id !== null;

        if (hasLine) data.line = toInt(data.line);
        if (data.quantity !== undefined) data.quantity = toInt(data.quantity);

        if (!hasLine && !hasId) throw new Error("cart.change requires { line } or { id }");
        if (data.quantity === null) throw new Error("cart.change requires a valid quantity");

        const changed = await post(defaults.endpoints.change, data);
        const cart = options.skipCartFetch ? null : await api.get();
        if (cart) emit(defaults.events.updated, { cart, action: "change", changed, params: data });
        return options.skipCartFetch ? changed : cart;
      }),

    remove: (target, options = {}) =>
      runQueued(async () => {
        const data = {};
        if (target && typeof target === "object") {
          if (target.line != null) data.line = toInt(target.line);
          if (target.id != null) data.id = target.id;
        } else if (typeof target === "number" || (typeof target === "string" && /^\d+$/.test(target))) {
          data.line = toInt(target);
        } else {
          data.id = target;
        }
        data.quantity = 0;

        const changed = await post(defaults.endpoints.change, data);
        const cart = options.skipCartFetch ? null : await api.get();
        if (cart) emit(defaults.events.updated, { cart, action: "remove", changed, params: data });
        return options.skipCartFetch ? changed : cart;
      }),

    update: (payload, options = {}) =>
      runQueued(async () => {
        const data = { ...payload };
        const updated = await post(defaults.endpoints.update, data);
        const cart = options.skipCartFetch ? null : await api.get();
        if (cart) emit(defaults.events.updated, { cart, action: "update", updated, params: data });
        return options.skipCartFetch ? updated : cart;
      }),

    clear: (options = {}) =>
      runQueued(async () => {
        const cleared = await post(defaults.endpoints.clear, {});
        const cart = options.skipCartFetch ? null : await api.get();
        if (cart) emit(defaults.events.updated, { cart, action: "clear", cleared });
        return options.skipCartFetch ? cleared : cart;
      }),

    setNote: (note, options = {}) => api.update({ note: note || "" }, options),

    setAttributes: (attributes, options = {}) => api.update({ attributes: attributes || {} }, options),

    renderSections: async (sectionIds, url) => {
      const ids = Array.isArray(sectionIds) ? sectionIds : [sectionIds];
      const u = new URL(url || window.location.href, window.location.origin);
      u.searchParams.set("sections", ids.join(","));
      const res = await fetch(u.toString(), { credentials: "same-origin", headers: { Accept: "application/json" } });
      if (!res.ok) {
        const err = new Error("Section render failed");
        err.status = res.status;
        throw err;
      }
      return res.json();
    },
  };

  const wrapWithErrorEvent = (name) => {
    const fn = api[name];
    api[name] = async (...args) => {
      try {
        return await fn(...args);
      } catch (err) {
        emit(defaults.events.error, { action: name, error: err });
        throw err;
      }
    };
  };

  ["add", "change", "remove", "update", "clear", "setNote", "setAttributes"].forEach(wrapWithErrorEvent);

  GGMS.cart = api;
})();