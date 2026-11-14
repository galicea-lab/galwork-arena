/**
 * Port TS `wf/services/form_permissions.py` (galwork-hub) - filtrowanie
 * JSON Schema/UI Schema wg macierzy `x-permissions` dla jednego kroku obiegu.
 *
 * Używane WYŁĄCZNIE do podglądu formularza po stronie klienta (Narzędzia
 * twórcy -> Testuj formularz, src/pages/process-models/form-tester.tsx) -
 * backend (`task_form()`) stosuje tę samą logikę przy serwowaniu
 * `GET /tasks/{id}/form` dla prawdziwych instancji procesu. 
 * Pamiętaj o synchronizacji zmian tych dwóch modułów.
 *
 * `x-permissions` może być nazwą profilu ze słownika
 * `x-permission-profiles` w korzeniu schematu (nieznany profil = "none").
 * wspólne sekcje w `$defs` - pole `{"$ref": "#/$defs/..."}`
 * filtrowane jak jego definicja; w wyniku zostają `$ref` i tylko definicje
 * widoczne w kroku.
 */

export type JsonObject = Record<string, unknown>;

type Permission = 'editable' | 'readonly' | 'none' | string;

/* BEGIN 2026-11-13 */
const PROFILES_KEY = 'x-permission-profiles';
const STRIPPED_KEYS = new Set(['x-permissions', 'x-required-in-steps', PROFILES_KEY]);

function rootProfiles(schema: unknown): JsonObject {
  return isPlainObject(schema) && isPlainObject(schema[PROFILES_KEY]) ? (schema[PROFILES_KEY] as JsonObject) : {};
}

const DEFS_KEY = '$defs';
const DEFS_PREFIX = '#/$defs/';

/** Słowniki z korzenia schematu wspólne dla całego filtrowania. */
interface Context {
  profiles: JsonObject;
  defs: JsonObject;
  filteredDefs: Map<string, JsonObject>;
}

function rootDefs(schema: unknown): JsonObject {
  return isPlainObject(schema) && isPlainObject(schema[DEFS_KEY]) ? (schema[DEFS_KEY] as JsonObject) : {};
}

/** Nazwa definicji z `$defs`, gdy węzeł to lokalne `$ref` do niej. */
function defName(node: JsonObject, defs: JsonObject): string | null {
  const ref = node.$ref;
  if (typeof ref === 'string' && ref.startsWith(DEFS_PREFIX)) {
    const name = ref.slice(DEFS_PREFIX.length);
    if (isPlainObject(defs[name])) return name;
  }
  return null;
}

/** `x-required-in-steps` węzła albo definicji, którą wskazuje. */
function requiredSteps(node: JsonObject, ctx: Context): unknown {
  const name = defName(node, ctx.defs);
  if (!('x-required-in-steps' in node) && name !== null) {
    return (ctx.defs[name] as JsonObject)['x-required-in-steps'];
  }
  return node['x-required-in-steps'];
}

/** Macierz pola: obiekt wprost albo nazwa profilu z `x-permission-profiles`. */
function resolvePermissions(permissions: unknown, profiles: JsonObject): unknown {
  if (typeof permissions === 'string') {
    const profile = profiles[permissions];
    return isPlainObject(profile) ? profile : {};
  }
  return permissions;
}
/* -END */

/** Czy schemat (rekurencyjnie) niesie choć jedno pole z `x-permissions` -
 * tylko takie formularze mają sens do filtrowania per krok. */
export function hasXPermissions(node: unknown): boolean {
  if (!isPlainObject(node)) return false;
  if ('x-permissions' in node) return true;
  const properties = node.properties;
  if (isPlainObject(properties)) {
    if (Object.values(properties).some((child) => hasXPermissions(child))) return true;
  }
  const items = node.items;
  if (isPlainObject(items)) {
    return hasXPermissions(items);
  }
  // macierz może być tylko w definicjach `$defs`.
  const defs = node[DEFS_KEY];
  if (isPlainObject(defs) && Object.values(defs).some((child) => hasXPermissions(child))) return true;
  // sekcje warunkowe (allOf/if/then/else) też niosą macierz.
  return conditionalBranches(node).some((branch) => hasXPermissions(branch));
}

/** Wszystkie nazwy kroków występujące w `x-permissions` gdziekolwiek w
 * schemacie (do zbudowania listy wyboru kroku w testerze formularzy). */
export function collectStepNames(node: unknown): string[] {
  const steps = new Set<string>();
  // kroki z profili uprawnień.
  const profiles = rootProfiles(node);
  const walk = (n: unknown) => {
    if (!isPlainObject(n)) return;
    const permissions = resolvePermissions(n['x-permissions'], profiles);
    if (isPlainObject(permissions)) {
      Object.keys(permissions).forEach((step) => steps.add(step));
    }
    const properties = n.properties;
    if (isPlainObject(properties)) {
      Object.values(properties).forEach(walk);
    }
    const items = n.items;
    if (isPlainObject(items)) {
      walk(items);
    }
    // kroki z pól sekcji warunkowych.
    conditionalBranches(n).forEach(walk);
  };
  walk(node);
  // kroki z pól wspólnych sekcji (`$defs`).
  Object.values(rootDefs(node)).forEach(walk);
  return Array.from(steps);
}

function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/* BEGIN 2026-11-12 */
// Sekcje warunkowe - port `_conditional_branches`/`_filter_conditionals`/
// `_merge_ui` z galwork-hub wf/services/form_permissions.py.
const CONDITIONAL_KEYS = ['then', 'else'] as const;

function conditionalHolders(node: JsonObject): JsonObject[] {
  const allOf = Array.isArray(node.allOf) ? node.allOf.filter(isPlainObject) : [];
  return [node, ...allOf];
}

function conditionalBranches(node: JsonObject): JsonObject[] {
  return conditionalHolders(node).flatMap((holder) =>
    CONDITIONAL_KEYS.map((key) => holder[key]).filter(isPlainObject)
  );
}

function mergeUi(uis: JsonObject[]): JsonObject {
  const merged: JsonObject = {};
  const keys = Array.from(new Set(uis.flatMap((ui) => Object.keys(ui))));
  keys.forEach((key) => {
    const values = uis.filter((ui) => key in ui).map((ui) => ui[key]);
    if (values.every(isPlainObject)) {
      merged[key] = mergeUi(values as JsonObject[]);
    } else if (key === 'ui:order') {
      const first = JSON.stringify(values[0]);
      if (values.every((value) => JSON.stringify(value) === first)) merged[key] = values[0];
    } else {
      merged[key] = values[0];
    }
  });
  return merged;
}

function filterConditionals(
  schemaNode: JsonObject,
  uiNode: JsonObject | undefined,
  step: string,
  filteredSchema: JsonObject,
  filteredUi: JsonObject,
  ctx: Context
): Set<string> {
  const keptNames = new Set<string>();
  const branchUis = new Map<string, JsonObject[]>();

  const filterHolder = (holder: JsonObject): JsonObject => {
    const result: JsonObject = { ...holder };
    CONDITIONAL_KEYS.forEach((key) => {
      const branch = holder[key];
      if (!isPlainObject(branch)) return;
      const [filteredBranch, branchUi] = filterNode(branch, uiNode, step, ctx);
      if (filteredBranch === null) {
        delete result[key];
        return;
      }
      result[key] = filteredBranch;
      if (isPlainObject(filteredBranch.properties)) {
        Object.keys(filteredBranch.properties).forEach((name) => keptNames.add(name));
      }
      Object.entries(branchUi).forEach(([name, childUi]) => {
        if (name.startsWith('ui:') || !isPlainObject(childUi)) return;
        branchUis.set(name, [...(branchUis.get(name) ?? []), childUi]);
      });
    });
    return result;
  };

  if (CONDITIONAL_KEYS.some((key) => isPlainObject(schemaNode[key]))) {
    const filteredNode = filterHolder(schemaNode);
    CONDITIONAL_KEYS.forEach((key) => {
      if (key in filteredNode) filteredSchema[key] = filteredNode[key];
      else delete filteredSchema[key];
    });
  }
  if (Array.isArray(schemaNode.allOf)) {
    filteredSchema.allOf = schemaNode.allOf.map((sub) => (isPlainObject(sub) ? filterHolder(sub) : sub));
  }
  branchUis.forEach((uis, name) => {
    filteredUi[name] = mergeUi(uis);
  });
  return keptNames;
}
/* -END */

function filterNode(
  schemaNode: JsonObject,
  uiNode: JsonObject | undefined,
  step: string,
  ctx: Context
): [JsonObject | null, JsonObject] {
  // `x-permissions` może być nazwą profilu.
  const permissions = resolvePermissions(schemaNode['x-permissions'], ctx.profiles);
  if (isPlainObject(permissions)) {
    const permission: Permission = (permissions[step] as Permission) ?? 'none';
    if (permission === 'none') {
      return [null, {}];
    }
  }

  const filteredSchema: JsonObject = {};
  Object.entries(schemaNode).forEach(([key, value]) => {
    if (!STRIPPED_KEYS.has(key)) {
      filteredSchema[key] = value;
    }
  });
  const filteredUi: JsonObject = {};
  if (uiNode) {
    Object.entries(uiNode).forEach(([key, value]) => {
      if (key.startsWith('ui:') && key !== 'ui:order') {
        filteredUi[key] = value;
      }
    });
  }

  if (isPlainObject(permissions) && permissions[step] === 'readonly') {
    filteredSchema.readOnly = true;
  }

  // `$ref` do `$defs` - filtrujemy definicję, pole zostaje odwołaniem.
  const refName = defName(schemaNode, ctx.defs);
  if (refName !== null) {
    const [filteredDef, defUi] = filterNode(ctx.defs[refName] as JsonObject, uiNode, step, ctx);
    if (filteredDef === null) return [null, {}];
    ctx.filteredDefs.set(refName, filteredDef);
    Object.assign(filteredUi, defUi);
    return [filteredSchema, filteredUi];
  }

  // najpierw gałęzie warunkowe - ich pola liczą się do `ui:order`.
  const conditionalNames = filterConditionals(schemaNode, uiNode, step, filteredSchema, filteredUi, ctx);

  const properties = schemaNode.properties;
  if (isPlainObject(properties)) {
    const keptProperties: JsonObject = {};
    const required = new Set(Array.isArray(schemaNode.required) ? (schemaNode.required as string[]) : []);
    const stepRequired = new Set<string>();

    Object.entries(properties).forEach(([name, child]) => {
      if (!isPlainObject(child)) {
        keptProperties[name] = child;
        return;
      }
      const childUi = uiNode && isPlainObject(uiNode[name]) ? (uiNode[name] as JsonObject) : undefined;
      const [filteredChild, filteredChildUi] = filterNode(child, childUi, step, ctx);
      if (filteredChild === null) return;
      keptProperties[name] = filteredChild;
      if (Object.keys(filteredChildUi).length > 0) {
        filteredUi[name] = filteredChildUi;
      }
      const requiredInSteps = requiredSteps(child, ctx);
      if (Array.isArray(requiredInSteps) && requiredInSteps.includes(step)) {
        stepRequired.add(name);
      }
    });

    filteredSchema.properties = keptProperties;
    const finalRequired = Array.from(new Set([...required, ...stepRequired]))
      .filter((name) => name in keptProperties)
      .sort();
    if (finalRequired.length > 0) {
      filteredSchema.required = finalRequired;
    } else {
      delete filteredSchema.required;
    }

    const originalOrder = uiNode?.['ui:order'];
    if (Array.isArray(originalOrder)) {
      // "*" i pola gałęzi warunkowych zostają (jak w hubie).
      const newOrder = (originalOrder as string[]).filter(
        (name) => name === '*' || name in keptProperties || conditionalNames.has(name)
      );
      if (newOrder.length > 0) {
        filteredUi['ui:order'] = newOrder;
      }
    }
  }

  const items = schemaNode.items;
  if (isPlainObject(items)) {
    const itemsUi = uiNode && isPlainObject(uiNode.items) ? (uiNode.items as JsonObject) : undefined;
    const [filteredItems, filteredItemsUi] = filterNode(items, itemsUi, step, ctx);
    filteredSchema.items = filteredItems ?? { type: 'object', properties: {} };
    if (Object.keys(filteredItemsUi).length > 0) {
      filteredUi.items = filteredItemsUi;
    }
  }

  return [filteredSchema, filteredUi];
}

/** Filtruje JSON Schema + UI Schema formularza dla kroku `step` (nazwa
 * zadania BPMN - klucz w `x-permissions`). Węzeł najwyższego poziomu nie ma
 * własnego `x-permissions`, więc nigdy nie zostaje całkowicie wycięty. */
export function filterFormForStep(
  schema: JsonObject,
  uiSchema: JsonObject | undefined,
  step: string
): { schema: JsonObject; uiSchema: JsonObject } {
  const ctx: Context = { profiles: rootProfiles(schema), defs: rootDefs(schema), filteredDefs: new Map() };
  const [filteredSchema, filteredUi] = filterNode(schema, uiSchema, step, ctx);
  // tylko definicje widoczne w kroku; `$defs` bez macierzy bez zmian.
  if (filteredSchema !== null && DEFS_KEY in filteredSchema) {
    const keptDefs: JsonObject = {};
    Object.entries(ctx.defs).forEach(([name, value]) => {
      const filtered = ctx.filteredDefs.get(name);
      if (filtered !== undefined) keptDefs[name] = filtered;
      else if (!hasXPermissions(value)) keptDefs[name] = value;
    });
    if (Object.keys(keptDefs).length > 0) filteredSchema[DEFS_KEY] = keptDefs;
    else delete filteredSchema[DEFS_KEY];
  }
  return { schema: filteredSchema ?? { type: 'object', properties: {} }, uiSchema: filteredUi };
}
