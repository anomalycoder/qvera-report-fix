import json
import re
from typing import Any, Dict, List, Optional, Tuple
from app.core.database import get_db_connection
from app.schemas.taxonomy import (
    EditScopeValidationResult,
    FullTaxonomyResponse,
    RepairConfigItem,
    RepairDefinition,
    RepairDetailResponse,
    TaxonomyData,
    TaxonomyVersionEntry,
    TriageConfigSettings,
    VerdictConfigItem,
)
from app.services.data_loader import data_loader

ALLOWED_QUESTION_FIELDS = ("question", "solution", "answer", "questionType")
ALLOWED_ROUTES = ("auto_apply", "faculty_review", "no_change")
ID_PATTERN = re.compile(r"^[a-z][a-z0-9_]{1,47}$")


class TaxonomyError(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


class TaxonomyService:
    """Centralized, versioned Taxonomy configuration engine.
    Seeds v1 from immutable data/taxonomy.json and persists subsequent administrator updates in SQLite.
    """

    def __init__(self):
        self._data: Optional[TaxonomyData] = None
        self._verdicts_meta: Dict[str, Dict[str, Any]] = {}
        self._repairs_meta: Dict[str, Dict[str, Any]] = {}
        self._triage_config: TriageConfigSettings = TriageConfigSettings()
        self._current_version: int = 1
        self._updated_at: Optional[str] = None
        self._updated_by: Optional[str] = None

    def _default_meta_from_seed(self, raw: Dict[str, Any]) -> Tuple[Dict[str, str], Dict[str, Any], Dict[str, Any], Dict[str, Any]]:
        raw_verdicts = raw.get("verdicts", {})
        raw_repairs = raw.get("repairs", {})

        v_meta: Dict[str, Any] = {}
        for k in raw_verdicts.keys():
            route = "faculty_review" if k == "defect" else "no_change"
            v_meta[k] = {
                "display_name": k.replace("_", " ").title(),
                "active": True,
                "default_route": route,
            }

        r_meta: Dict[str, Any] = {}
        for k in raw_repairs.keys():
            r_meta[k] = {
                "display_name": k.replace("_", " ").title(),
                "active": True,
            }

        return raw_verdicts, raw_repairs, v_meta, r_meta

    def reload(self) -> None:
        self._data = None
        self._ensure_loaded()

    def _ensure_loaded(self) -> TaxonomyData:
        if self._data is not None:
            return self._data

        row = None
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM taxonomy_versions ORDER BY version DESC LIMIT 1;")
                row = cursor.fetchone()
                if not row:
                    seed_raw = data_loader.load_taxonomy()
                    verdicts, repairs, v_meta, r_meta = self._default_meta_from_seed(seed_raw)
                    triage_cfg = TriageConfigSettings().model_dump()
                    cursor.execute(
                        """
                        INSERT INTO taxonomy_versions (
                            verdicts_json, repairs_json, verdicts_meta_json, repairs_meta_json,
                            triage_config_json, change_summary, updated_by, updated_by_role
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                        """,
                        (
                            json.dumps(verdicts, ensure_ascii=False),
                            json.dumps(repairs, ensure_ascii=False),
                            json.dumps(v_meta, ensure_ascii=False),
                            json.dumps(r_meta, ensure_ascii=False),
                            json.dumps(triage_cfg, ensure_ascii=False),
                            "Initial seed from data/taxonomy.json",
                            "system",
                            "system",
                        ),
                    )
                    conn.commit()
                    cursor.execute("SELECT * FROM taxonomy_versions ORDER BY version DESC LIMIT 1;")
                    row = cursor.fetchone()
        except Exception:
            row = None

        if row:
            raw_verdicts = json.loads(row["verdicts_json"])
            raw_repairs = json.loads(row["repairs_json"])
            self._verdicts_meta = json.loads(row["verdicts_meta_json"])
            self._repairs_meta = json.loads(row["repairs_meta_json"])
            self._triage_config = TriageConfigSettings(**json.loads(row["triage_config_json"]))
            self._current_version = int(row["version"])
            self._updated_at = row["created_at"]
            self._updated_by = row["updated_by"]
        else:
            seed_raw = data_loader.load_taxonomy()
            raw_verdicts, raw_repairs, v_meta, r_meta = self._default_meta_from_seed(seed_raw)
            self._verdicts_meta = v_meta
            self._repairs_meta = r_meta
            self._triage_config = TriageConfigSettings()
            self._current_version = 1

        repairs_dict = {}
        for k, v in raw_repairs.items():
            repairs_dict[k] = RepairDefinition(
                fields=list(v.get("fields", [])),
                auto=bool(v.get("auto", False)),
                label=str(v.get("label", "")),
            )

        self._data = TaxonomyData(verdicts=raw_verdicts, repairs=repairs_dict)
        return self._data

    def get_taxonomy_data(self) -> TaxonomyData:
        self._data = None
        return self._ensure_loaded()

    def get_version(self) -> int:
        self._ensure_loaded()
        return self._current_version

    def get_confidence_floor(self) -> float:
        self._ensure_loaded()
        return self._triage_config.auto_apply_confidence_floor

    def get_verdicts(self) -> Dict[str, str]:
        return self.get_taxonomy_data().verdicts

    def get_repairs(self) -> Dict[str, RepairDefinition]:
        return self.get_taxonomy_data().repairs

    def is_valid_verdict(self, verdict_key: str) -> bool:
        return verdict_key in self.get_verdicts()

    def is_verdict_active(self, verdict_key: str) -> bool:
        self._ensure_loaded()
        if verdict_key not in self._data.verdicts:
            return False
        return bool(self._verdicts_meta.get(verdict_key, {}).get("active", True))

    def is_valid_repair(self, repair_key: Optional[str]) -> bool:
        if repair_key is None:
            return True
        return repair_key in self.get_repairs()

    def is_repair_active(self, repair_key: Optional[str]) -> bool:
        if repair_key is None:
            return True
        self._ensure_loaded()
        if repair_key not in self._data.repairs:
            return False
        return bool(self._repairs_meta.get(repair_key, {}).get("active", True))

    def get_repair_detail(self, repair_key: str) -> Optional[RepairDetailResponse]:
        rep = self.get_repairs().get(repair_key)
        if not rep:
            return None
        return RepairDetailResponse(
            repair_key=repair_key,
            label=rep.label,
            fields=rep.fields,
            auto=rep.auto,
        )

    def get_permitted_fields(self, repair_key: str) -> List[str]:
        rep = self.get_repairs().get(repair_key)
        if not rep:
            raise ValueError(f"Unknown repair key '{repair_key}'")
        return rep.fields

    def is_auto_applicable(self, repair_key: str) -> bool:
        rep = self.get_repairs().get(repair_key)
        if not rep:
            raise ValueError(f"Unknown repair key '{repair_key}'")
        return bool(rep.auto and self.is_repair_active(repair_key))

    def supports_auto_apply(self, repair_key: str) -> bool:
        return self.is_auto_applicable(repair_key)

    def validate_edit_field(self, repair_key: str, target_field: str) -> bool:
        return self.validate_edit_scope(repair_key, target_field).is_valid

    def validate_edit_scope(self, repair_key: str, target_field: str) -> EditScopeValidationResult:
        repairs = self.get_repairs()
        if repair_key not in repairs:
            return EditScopeValidationResult(
                is_valid=False,
                repair_key=repair_key,
                target_field=target_field,
                permitted_fields=[],
                auto_allowed=False,
                error=f"Invalid repair key: '{repair_key}' does not exist in taxonomy.",
            )

        if not self.is_repair_active(repair_key):
            return EditScopeValidationResult(
                is_valid=False,
                repair_key=repair_key,
                target_field=target_field,
                permitted_fields=[],
                auto_allowed=False,
                error=f"Repair key '{repair_key}' is currently disabled in taxonomy v{self._current_version}.",
            )

        repair_def = repairs[repair_key]
        permitted = repair_def.fields
        if target_field not in permitted:
            return EditScopeValidationResult(
                is_valid=False,
                repair_key=repair_key,
                target_field=target_field,
                permitted_fields=permitted,
                auto_allowed=repair_def.auto,
                error=(
                    f"Forbidden field edit: Repair '{repair_key}' cannot modify '{target_field}'. "
                    f"Allowed fields: {permitted or 'none (human authoring only)'}"
                ),
            )

        return EditScopeValidationResult(
            is_valid=True,
            repair_key=repair_key,
            target_field=target_field,
            permitted_fields=permitted,
            auto_allowed=repair_def.auto,
            error=None,
        )

    def _compute_usage_counts(self) -> Tuple[Dict[str, int], Dict[str, int]]:
        verdict_usage: Dict[str, int] = {}
        repair_usage: Dict[str, int] = {}
        try:
            with get_db_connection() as conn:
                rows = conn.cursor().execute("SELECT verdict, repair FROM triage_records;").fetchall()
                for row in rows:
                    if row["verdict"]:
                        verdict_usage[row["verdict"]] = verdict_usage.get(row["verdict"], 0) + 1
                    if row["repair"]:
                        repair_usage[row["repair"]] = repair_usage.get(row["repair"], 0) + 1
        except Exception:
            pass
        return verdict_usage, repair_usage

    def get_full_configuration(self) -> FullTaxonomyResponse:
        self._data = None
        data = self._ensure_loaded()
        verdict_usage, repair_usage = self._compute_usage_counts()

        verdict_items = [
            VerdictConfigItem(
                id=vid,
                display_name=self._verdicts_meta.get(vid, {}).get("display_name", vid.replace("_", " ").title()),
                description=desc,
                active=bool(self._verdicts_meta.get(vid, {}).get("active", True)),
                default_route=self._verdicts_meta.get(vid, {}).get("default_route", "faculty_review" if vid == "defect" else "no_change"),
                usage_count=verdict_usage.get(vid, 0),
            )
            for vid, desc in data.verdicts.items()
        ]

        repair_items = [
            RepairConfigItem(
                id=rid,
                display_name=self._repairs_meta.get(rid, {}).get("display_name", rid.replace("_", " ").title()),
                label=rdef.label,
                fields=list(rdef.fields),
                auto=bool(rdef.auto),
                active=bool(self._repairs_meta.get(rid, {}).get("active", True)),
                usage_count=repair_usage.get(rid, 0),
            )
            for rid, rdef in data.repairs.items()
        ]

        versions_list: List[TaxonomyVersionEntry] = []
        with get_db_connection() as conn:
            rows = conn.cursor().execute(
                "SELECT version, verdicts_json, repairs_json, change_summary, updated_by, updated_by_role, created_at FROM taxonomy_versions ORDER BY version DESC LIMIT 30;"
            ).fetchall()
            for r in rows:
                versions_list.append(
                    TaxonomyVersionEntry(
                        version=int(r["version"]),
                        change_summary=r["change_summary"],
                        updated_by=r["updated_by"],
                        updated_by_role=r["updated_by_role"],
                        created_at=str(r["created_at"]),
                        verdict_count=len(json.loads(r["verdicts_json"])),
                        repair_count=len(json.loads(r["repairs_json"])),
                    )
                )

        return FullTaxonomyResponse(
            version=self._current_version,
            updated_at=self._updated_at,
            updated_by=self._updated_by,
            available_fields=list(ALLOWED_QUESTION_FIELDS),
            verdicts=verdict_items,
            repairs=repair_items,
            triage_config=self._triage_config,
            versions=versions_list,
        )

    def _validate_id(self, identifier: str) -> str:
        clean = identifier.strip().lower()
        if not ID_PATTERN.match(clean):
            raise TaxonomyError(422, f"Invalid identifier '{identifier}'. Use lowercase snake_case (letters, digits, underscore).")
        return clean

    def _validate_fields(self, fields: List[str]) -> List[str]:
        invalid = [f for f in fields if f not in ALLOWED_QUESTION_FIELDS]
        if invalid:
            raise TaxonomyError(422, f"Invalid question field(s): {invalid}. Allowed schema fields: {list(ALLOWED_QUESTION_FIELDS)}.")
        # preserve deduplicated schema order
        return [f for f in ALLOWED_QUESTION_FIELDS if f in fields]

    def _save_new_version(
        self,
        verdicts: Dict[str, str],
        repairs_raw: Dict[str, Dict[str, Any]],
        v_meta: Dict[str, Any],
        r_meta: Dict[str, Any],
        triage_cfg: TriageConfigSettings,
        change_summary: str,
        actor: Dict[str, Any],
        expected_version: Optional[int],
        audit_action: str = "taxonomy_updated",
        prev_snapshot: Optional[str] = None,
        new_snapshot: Optional[str] = None,
    ) -> FullTaxonomyResponse:
        actor_name = actor.get("name") or "Administrator"
        actor_email = actor.get("email") or "admin"
        actor_role = actor.get("role") or "admin"

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cur_row = cursor.execute("SELECT version FROM taxonomy_versions ORDER BY version DESC LIMIT 1;").fetchone()
            cur_ver = int(cur_row["version"]) if cur_row else 1
            if expected_version is not None and cur_ver != expected_version:
                raise TaxonomyError(
                    409,
                    f"Concurrent configuration conflict: active taxonomy is v{cur_ver}, but your session loaded v{expected_version}. Reload latest first.",
                )

            cursor.execute(
                """
                INSERT INTO taxonomy_versions (
                    verdicts_json, repairs_json, verdicts_meta_json, repairs_meta_json,
                    triage_config_json, change_summary, updated_by, updated_by_role
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                """,
                (
                    json.dumps(verdicts, ensure_ascii=False),
                    json.dumps(repairs_raw, ensure_ascii=False),
                    json.dumps(v_meta, ensure_ascii=False),
                    json.dumps(r_meta, ensure_ascii=False),
                    json.dumps(triage_cfg.model_dump(), ensure_ascii=False),
                    change_summary,
                    actor_name,
                    actor_role,
                ),
            )
            new_ver = cursor.lastrowid
            cursor.execute(
                """
                INSERT INTO audit_logs (
                    report_id, question_id, action, faculty_id, faculty_name,
                    actor_type, status, previous_value, new_value, notes, applied_edit
                ) VALUES (?, ?, ?, ?, ?, 'admin', 'success', ?, ?, ?, NULL);
                """,
                (
                    f"TAX-v{new_ver}",
                    "taxonomy_config",
                    audit_action,
                    actor_email,
                    actor_name,
                    prev_snapshot or f"taxonomy_version=v{cur_ver}",
                    new_snapshot or f"taxonomy_version=v{new_ver}",
                    f"[v{cur_ver} -> v{new_ver}] {change_summary}",
                ),
            )
            cursor.execute(
                """
                INSERT INTO notifications (report_id, question_id, title, message, category, urgency, target_tab, is_read)
                VALUES (?, 'taxonomy_config', ?, ?, 'system', 'info', 'settings', 0);
                """,
                (
                    f"TAX-v{new_ver}",
                    f"Taxonomy Updated · v{new_ver}",
                    f"{actor_name}: {change_summary}",
                ),
            )
            conn.commit()

        self.reload()
        self._broadcast_taxonomy_event(new_ver, change_summary, actor_name)
        return self.get_full_configuration()

    def _broadcast_taxonomy_event(self, new_ver: int, summary: str, actor_name: str) -> None:
        try:
            from app.api.v1.endpoints.faculty import _publish_realtime_event
            _publish_realtime_event({
                "type": "taxonomy_update",
                "event_type": "taxonomy_update",
                "queue_update": True,
                "taxonomy_version": new_ver,
                "summary": summary,
                "actor": actor_name,
            })
        except Exception:
            pass

    def _serialize_repairs(self, repairs_objs: Dict[str, RepairDefinition]) -> Dict[str, Dict[str, Any]]:
        return {k: {"fields": v.fields, "auto": v.auto, "label": v.label} for k, v in repairs_objs.items()}

    def add_verdict(self, vid: str, display_name: str, description: str, active: bool, default_route: str, actor: Dict[str, Any], expected_version: Optional[int], reason: Optional[str]) -> FullTaxonomyResponse:
        clean_id = self._validate_id(vid)
        if default_route not in ALLOWED_ROUTES:
            raise TaxonomyError(422, f"Invalid default_route '{default_route}'.")
        data = self.get_taxonomy_data()
        if clean_id in data.verdicts:
            raise TaxonomyError(409, f"Duplicate identifier: Verdict '{clean_id}' already exists.")

        verdicts = dict(data.verdicts)
        verdicts[clean_id] = description.strip()
        v_meta = json.loads(json.dumps(self._verdicts_meta))
        v_meta[clean_id] = {"display_name": display_name.strip(), "active": active, "default_route": default_route}
        summary = reason or f"Added verdict '{clean_id}'"
        return self._save_new_version(verdicts, self._serialize_repairs(data.repairs), v_meta, self._repairs_meta, self._triage_config, summary, actor, expected_version)

    def update_verdict(self, vid: str, display_name: str, description: str, active: bool, default_route: str, actor: Dict[str, Any], expected_version: Optional[int], reason: Optional[str]) -> FullTaxonomyResponse:
        if default_route not in ALLOWED_ROUTES:
            raise TaxonomyError(422, f"Invalid default_route '{default_route}'.")
        data = self.get_taxonomy_data()
        if vid not in data.verdicts:
            raise TaxonomyError(404, f"Verdict '{vid}' not found.")

        prev_desc = data.verdicts[vid]
        prev_active = self._verdicts_meta.get(vid, {}).get("active", True)
        verdicts = dict(data.verdicts)
        verdicts[vid] = description.strip()
        v_meta = json.loads(json.dumps(self._verdicts_meta))
        v_meta[vid] = {"display_name": display_name.strip(), "active": active, "default_route": default_route}
        summary = reason or f"Updated verdict '{vid}' (active={active})"
        return self._save_new_version(
            verdicts,
            self._serialize_repairs(data.repairs),
            v_meta,
            self._repairs_meta,
            self._triage_config,
            summary,
            actor,
            expected_version,
            prev_snapshot=json.dumps({"id": vid, "description": prev_desc, "active": prev_active}),
            new_snapshot=json.dumps({"id": vid, "description": description.strip(), "active": active}),
        )

    def add_repair(self, rid: str, display_name: str, label: str, fields: List[str], auto: bool, confirm_auto_promotion: bool, active: bool, actor: Dict[str, Any], expected_version: Optional[int], reason: Optional[str]) -> FullTaxonomyResponse:
        clean_id = self._validate_id(rid)
        clean_fields = self._validate_fields(fields)
        if auto and not confirm_auto_promotion:
            raise TaxonomyError(422, "Explicit confirmation required before enabling automatic application (auto: true).")
        if auto and not clean_fields:
            raise TaxonomyError(422, "Repairs with auto: true must declare at least one permitted mutation field.")

        data = self.get_taxonomy_data()
        if clean_id in data.repairs:
            raise TaxonomyError(409, f"Duplicate identifier: Repair type '{clean_id}' already exists.")

        repairs_raw = self._serialize_repairs(data.repairs)
        repairs_raw[clean_id] = {"fields": clean_fields, "auto": bool(auto), "label": label.strip()}
        r_meta = json.loads(json.dumps(self._repairs_meta))
        r_meta[clean_id] = {"display_name": display_name.strip(), "active": active}
        summary = reason or f"Added repair type '{clean_id}' (auto={auto})"
        return self._save_new_version(data.verdicts, repairs_raw, self._verdicts_meta, r_meta, self._triage_config, summary, actor, expected_version)

    def update_repair(self, rid: str, display_name: str, label: str, fields: List[str], auto: bool, confirm_auto_promotion: bool, active: bool, actor: Dict[str, Any], expected_version: Optional[int], reason: Optional[str]) -> FullTaxonomyResponse:
        clean_fields = self._validate_fields(fields)
        data = self.get_taxonomy_data()
        if rid not in data.repairs:
            raise TaxonomyError(404, f"Repair type '{rid}' not found.")

        prev_def = data.repairs[rid]
        prev_active = self._repairs_meta.get(rid, {}).get("active", True)
        if (not prev_def.auto) and auto and not confirm_auto_promotion:
            raise TaxonomyError(422, f"Promoting '{rid}' from auto: false to auto: true requires explicit administrator confirmation.")
        if auto and not clean_fields:
            raise TaxonomyError(422, f"Repair '{rid}' cannot enable auto-apply with zero permitted fields.")

        repairs_raw = self._serialize_repairs(data.repairs)
        repairs_raw[rid] = {"fields": clean_fields, "auto": bool(auto), "label": label.strip()}
        r_meta = json.loads(json.dumps(self._repairs_meta))
        r_meta[rid] = {"display_name": display_name.strip(), "active": active}
        summary = reason or f"Updated repair '{rid}' (auto={auto}, active={active}, fields={clean_fields})"
        return self._save_new_version(
            data.verdicts,
            repairs_raw,
            self._verdicts_meta,
            r_meta,
            self._triage_config,
            summary,
            actor,
            expected_version,
            prev_snapshot=json.dumps({"id": rid, "fields": prev_def.fields, "auto": prev_def.auto, "active": prev_active}),
            new_snapshot=json.dumps({"id": rid, "fields": clean_fields, "auto": auto, "active": active}),
        )

    def update_triage_config(self, floor: float, req_verif: bool, block_inj: bool, actor: Dict[str, Any], expected_version: Optional[int], reason: Optional[str]) -> FullTaxonomyResponse:
        data = self.get_taxonomy_data()
        prev_cfg = self._triage_config.model_dump()
        new_cfg = TriageConfigSettings(
            auto_apply_confidence_floor=round(float(floor), 2),
            require_independent_verification=bool(req_verif),
            block_prompt_injections=bool(block_inj),
        )
        summary = reason or f"Updated AI triage confidence floor to {int(new_cfg.auto_apply_confidence_floor * 100)}%"
        return self._save_new_version(
            data.verdicts,
            self._serialize_repairs(data.repairs),
            self._verdicts_meta,
            self._repairs_meta,
            new_cfg,
            summary,
            actor,
            expected_version,
            prev_snapshot=json.dumps(prev_cfg),
            new_snapshot=json.dumps(new_cfg.model_dump()),
        )

    def import_advanced_json(self, raw_json: Dict[str, Any], confirm_auto_promotion: bool, actor: Dict[str, Any], expected_version: Optional[int], reason: Optional[str]) -> FullTaxonomyResponse:
        allowed_top = {"verdicts", "repairs"}
        unknown = set(raw_json.keys()) - allowed_top
        if unknown:
            raise TaxonomyError(422, f"Unsupported top-level keys in taxonomy JSON: {sorted(unknown)}")
        if not isinstance(raw_json.get("verdicts"), dict) or not raw_json["verdicts"]:
            raise TaxonomyError(422, "Taxonomy JSON must define a non-empty 'verdicts' object.")
        if not isinstance(raw_json.get("repairs"), dict) or not raw_json["repairs"]:
            raise TaxonomyError(422, "Taxonomy JSON must define a non-empty 'repairs' object.")

        cur = self.get_taxonomy_data()
        # Preserve existing verdict identifiers referenced by dataset
        verdicts_out: Dict[str, str] = {}
        for k, v in raw_json["verdicts"].items():
            self._validate_id(k)
            if not isinstance(v, str) or len(v.strip()) < 5:
                raise TaxonomyError(422, f"Verdict '{k}' description must be a meaningful string.")
            verdicts_out[k] = v.strip()

        repairs_out: Dict[str, Dict[str, Any]] = {}
        for k, v in raw_json["repairs"].items():
            self._validate_id(k)
            if not isinstance(v, dict):
                raise TaxonomyError(422, f"Repair '{k}' must be an object.")
            allowed_r_keys = {"fields", "auto", "label"}
            if not set(v.keys()).issubset(allowed_r_keys):
                raise TaxonomyError(422, f"Unsupported keys in repair '{k}': {sorted(set(v.keys()) - allowed_r_keys)}")
            fields = self._validate_fields(list(v.get("fields", [])))
            auto = v.get("auto")
            label = str(v.get("label", "")).strip()
            if not isinstance(auto, bool) or len(label) < 5:
                raise TaxonomyError(422, f"Repair '{k}' requires boolean 'auto' and descriptive 'label'.")
            prev_auto = cur.repairs[k].auto if k in cur.repairs else False
            if (not prev_auto) and auto and not confirm_auto_promotion:
                raise TaxonomyError(422, f"Promoting '{k}' to auto: true requires explicit confirmation.")
            repairs_out[k] = {"fields": fields, "auto": auto, "label": label}

        v_meta = {
            k: self._verdicts_meta.get(k, {"display_name": k.replace("_", " ").title(), "active": True, "default_route": "faculty_review" if k == "defect" else "no_change"})
            for k in verdicts_out
        }
        r_meta = {
            k: self._repairs_meta.get(k, {"display_name": k.replace("_", " ").title(), "active": True})
            for k in repairs_out
        }
        return self._save_new_version(verdicts_out, repairs_out, v_meta, r_meta, self._triage_config, reason or "Imported validated taxonomy JSON", actor, expected_version)

    def rollback_to_version(self, target_version: int, actor: Dict[str, Any], expected_version: Optional[int], reason: Optional[str]) -> FullTaxonomyResponse:
        with get_db_connection() as conn:
            row = conn.cursor().execute("SELECT * FROM taxonomy_versions WHERE version = ?;", (target_version,)).fetchone()
            if not row:
                raise TaxonomyError(404, f"Taxonomy version v{target_version} does not exist.")
            verdicts = json.loads(row["verdicts_json"])
            repairs_raw = json.loads(row["repairs_json"])
            v_meta = json.loads(row["verdicts_meta_json"])
            r_meta = json.loads(row["repairs_meta_json"])
            triage_cfg = TriageConfigSettings(**json.loads(row["triage_config_json"]))

        summary = reason or f"Rolled back configuration by creating new version from v{target_version}"
        return self._save_new_version(
            verdicts,
            repairs_raw,
            v_meta,
            r_meta,
            triage_cfg,
            summary,
            actor,
            expected_version,
            audit_action="taxonomy_rollback",
            prev_snapshot=f"v{self.get_version()}",
            new_snapshot=f"restored_from=v{target_version}",
        )


taxonomy_service = TaxonomyService()
