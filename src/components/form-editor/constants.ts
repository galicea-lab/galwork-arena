// Stałe współdzielone przez edytor formularzy (schema.json + ioschema.json).

/**
 * Minimalny, poprawny JSON Schema dla nowego formularza obiegu.
 * (draft-07 - ten sam, którego używa reszta aplikacji/RJSF)
 */
export const DEFAULT_FORM_SCHEMA = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Nowy formularz",
  "type": "object",
  "properties": {
    "pole": {
      "type": "string",
      "title": "Pole"
    }
  }
}
`

/** Pusty uiSchema - RJSF użyje domyślnych widgetów. */
export const DEFAULT_FORM_UI_SCHEMA = '{}\n'
