/**
 * Port TS `wf/services/form_permissions.py` (galwork-hub) - filtrowanie
 * JSON Schema/UI Schema wg macierzy `x-permissions` dla jednego kroku obiegu.
 *
 * Używane WYŁĄCZNIE do podglądu formularza po stronie klienta (Narzędzia
 * twórcy -> Testuj formularz, src/pages/process-models/form-tester.tsx) -
 * backend (`task_form()`) stosuje tę samą logikę przy serwowaniu
 * `GET /tasks/{id}/form` dla prawdziwych instancji procesu. 
 * Pamiętaj o synchronizacji zmian tych dwóch modułów.
 */

export type JsonObject = Record<string, unknown>;

type Permission = 'editable' | 'readonly' | 'none' | string;

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
  return false;
}

/** Wszystkie nazwy kroków występujące w `x-permissions` gdziekolwiek w
 * schemacie (do zbudowania listy wyboru kroku w testerze formularzy). */
export function collectStepNames(node: unknown): string[] {
  const steps = new Set<string>();
  const walk = (n: unknown) => {
    if (!isPlainObject(n)) return;
    const permissions = n['x-permissions'];
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
  };
  walk(node);
  return Array.from(steps);
}

function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function filterNode(
  schemaNode: JsonObject,
  uiNode: JsonObject | undefined,
  step: string
): [JsonObject | null, JsonObject] {
  const permissions = schemaNode['x-permissions'];
  if (isPlainObject(permissions)) {
    const permission: Permission = (permissions[step] as Permission) ?? 'none';
    if (permission === 'none') {
      return [null, {}];
    }
  }

  const filteredSchema: JsonObject = {};
  Object.entries(schemaNode).forEach(([key, value]) => {
    if (key !== 'x-permissions' && key !== 'x-required-in-steps') {
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
      const [filteredChild, filteredChildUi] = filterNode(child, childUi, step);
      if (filteredChild === null) return;
      keptProperties[name] = filteredChild;
      if (Object.keys(filteredChildUi).length > 0) {
        filteredUi[name] = filteredChildUi;
      }
      const requiredInSteps = child['x-required-in-steps'];
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
      const newOrder = (originalOrder as string[]).filter((name) => name in keptProperties);
      if (newOrder.length > 0) {
        filteredUi['ui:order'] = newOrder;
      }
    }
  }

  const items = schemaNode.items;
  if (isPlainObject(items)) {
    const itemsUi = uiNode && isPlainObject(uiNode.items) ? (uiNode.items as JsonObject) : undefined;
    const [filteredItems, filteredItemsUi] = filterNode(items, itemsUi, step);
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
  const [filteredSchema, filteredUi] = filterNode(schema, uiSchema, step);
  return { schema: filteredSchema ?? { type: 'object', properties: {} }, uiSchema: filteredUi };
}
