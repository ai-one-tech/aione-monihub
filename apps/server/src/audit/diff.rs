use serde_json::Value;

use crate::audit::models::ChangeEntry;

pub fn diff_values(before: &Value, after: &Value) -> Vec<ChangeEntry> {
    let mut changes = Vec::new();
    diff_recursive(before, after, "", &mut changes);
    changes
}

fn push_change(
    changes: &mut Vec<ChangeEntry>,
    path: String,
    r#type: &str,
    before: Option<Value>,
    after: Option<Value>,
) {
    changes.push(ChangeEntry {
        path,
        r#type: r#type.to_string(),
        before,
        after,
    });
}

fn join_path(base: &str, key: &str) -> String {
    if base.is_empty() { key.to_string() } else { format!("{}.{}", base, key) }
}

fn diff_recursive(before: &Value, after: &Value, base: &str, changes: &mut Vec<ChangeEntry>) {
    match (before, after) {
        (Value::Object(bm), Value::Object(am)) => {
            // Removed keys
            for (k, bv) in bm.iter() {
                if !am.contains_key(k) {
                    push_change(changes, join_path(base, k), "removed", Some(bv.clone()), None);
                }
            }
            // Added + changed
            for (k, av) in am.iter() {
                match bm.get(k) {
                    None => push_change(changes, join_path(base, k), "added", None, Some(av.clone())),
                    Some(bv) => {
                        if bv != av {
                            // Dive into nested
                            diff_recursive(bv, av, &join_path(base, k), changes);
                        }
                    }
                }
            }
        }
        (Value::Array(ba), Value::Array(aa)) => {
            // For arrays, compare length and elements; record as changed when unequal
            if ba != aa {
                push_change(changes, base.to_string(), "changed", Some(before.clone()), Some(after.clone()));
            }
        }
        _ => {
            if before != after {
                push_change(changes, base.to_string(), "changed", Some(before.clone()), Some(after.clone()));
            }
        }
    }
}