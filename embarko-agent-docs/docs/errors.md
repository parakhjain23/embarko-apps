---
title: Errors
---

# Errors

Every machine code, with the page that handles it. Branch on `code`. Retry rules are in [rules](rules).

| code | HTTP | Page |
| --- | --- | --- |
| `unauthorized` | 401 | [claim](claim) |
| `not_found`, `lookup_failed` | 404, 502 | [status](status) |
| `app_not_found`, `app_renamed` | 404 | [address](address) |
| `invalid_app_name`, `app_name_too_short`, `app_name_too_long`, `app_name_reserved`, `app_name_taken`, `app_name_check_failed`, `rename_in_progress` | 400, 409, 502 | [deploy](deploy) |
| `invalid_app_version`, `invalid_app_type`, `invalid_agent_name`, `missing_source_file` | 400 | [deploy](deploy) |
| `invalid_json`, `invalid_file_path`, `invalid_file_content`, `invalid_file_encoding`, `source_too_large`, `too_many_files` | 400, 413 | [deploy](deploy) |
| `no_manifest_at_root`, `app_nested_in_subdirectory`, `unsupported_storage_pattern`, `invalid_static_root`, `app_kind_changed` | 422 | [deploy](deploy) |
| `deploy_failed`, `publish_failed` | 500 | [deploy](deploy) |
| `not_supported_for_static` | 409 | [static-sites](static-sites) |
| `invalid_env_var_key`, `env_var_not_found`, `no_current_deployment` | 400, 404, 422 | [env-vars](env-vars) |
| `no_rollback_target`, `rollback_not_successful_deployment`, `rollback_image_unavailable`, `deployment_not_found`, `rollback_push_failed` | 422, 404, 502 | [rollback](rollback) |
| `deploy_in_progress`, `slug_change_cooldown`, `app_state_unknown`, `rename_failed` | 409, 429, 503, 502 | [address](address) |
| `confirmation_required` | 400 | [delete](delete) |
| `invalid_domain`, `domain_reserved`, `domain_taken`, `domain_not_found` | 400, 409, 404 | [domains](domains) |
| `SHOWCASE_COLLECTION_UNKNOWN` | 404 | [showcase](showcase) |
| `invalid_feedback_type` | 400 | [feedback](feedback) |
| `validation_failed` | 400 | Any control-plane call. `details[].path` names the bad field. |
| `unknown_topic` | 404 | Wrong `/capabilities/<topic>` name. The body lists topics. |

Replies with no `code`: 429 rate limits, the domain verify 422, the analytics 503, and the feedback route's missing-header 400. Branch on HTTP status there.
