// نرمالایزر عمیق برای پروژه و تمام آبجکت‌های تو در تو
export function deepNormalizeProject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj.features)) obj.features = obj.features.map(deepNormalizeFeature);
  else obj.features = [];
  return obj;
}
export function deepNormalizeFeature(f: any): any {
  if (!f || typeof f !== 'object') return f;
  if (Array.isArray(f.rules)) f.rules = f.rules.map(deepNormalizeRule);
  else f.rules = [];
  if (Array.isArray(f.scenarios)) f.scenarios = f.scenarios.map(deepNormalizeScenario);
  else f.scenarios = [];
  if (Array.isArray(f.tags)) f.tags = f.tags;
  else f.tags = [];
  if (f.background) f.background = deepNormalizeBackground(f.background);
  else f.background = undefined;
  return f;
}
export function deepNormalizeRule(rule: any): any {
  if (!rule || typeof rule !== 'object') return rule;
  if (Array.isArray(rule.scenarios)) rule.scenarios = rule.scenarios.map(deepNormalizeScenario);
  else rule.scenarios = [];
  if (Array.isArray(rule.tags)) rule.tags = rule.tags;
  else rule.tags = [];
  return rule;
}
export function deepNormalizeScenario(s: any): any {
  if (!s || typeof s !== 'object') return s;
  if (Array.isArray(s.steps)) s.steps = s.steps.map((st: any) => (typeof st === 'object' ? deepNormalizeStep(st) : { text: String(st) }));
  else s.steps = [];
  if (Array.isArray(s.tags)) s.tags = s.tags;
  else s.tags = [];
  s.examples = deepNormalizeExamples(s.examples);
  return s;
}
export function deepNormalizeStep(st: any): any {
  if (!st || typeof st !== 'object') return { text: String(st) };
  if (st.dataTable && typeof st.dataTable === 'object') {
    if (!Array.isArray(st.dataTable.headers)) st.dataTable.headers = [];
    if (!Array.isArray(st.dataTable.rows)) st.dataTable.rows = [];
  }
  return st;
}
export function deepNormalizeBackground(bg: any): any {
  if (!bg || typeof bg !== 'object') return bg;
  if (Array.isArray(bg.steps)) bg.steps = bg.steps.map((st: any) => (typeof st === 'object' ? deepNormalizeStep(st) : { text: String(st) }));
  else bg.steps = [];
  return bg;
}
export function deepNormalizeExamples(examples: any): any {
  if (!examples || typeof examples !== 'object') return { headers: [], rows: [] };
  if (!Array.isArray(examples.headers)) examples.headers = [];
  if (!Array.isArray(examples.rows)) examples.rows = [];
  // فیکس ریشه‌ای: هر row.values اگر آبجکت بود و خودش values داشت، فقط آرایه داخلی را نگه دار
  examples.rows = examples.rows.map((row: any) => ({
    ...row,
    values: Array.isArray(row.values)
      ? row.values
      : (row.values && Array.isArray(row.values.values))
        ? row.values.values
        : []
  }));
  return examples;
} 