M09: migrate group and household preferences, members, integrations, data management, reports,
migration upload, admin management/create/edit, backups/maintenance/debug/setup. Reuse shared
entity table and actual backend resources. Acceptance: all extended strict routes and unchanged
admin flow, plus all preceding flows/core strict routes and unit/type/lint/build regression.
Destructive maintenance/restore operations must require an explicit UI confirmation on use.
Record gaps outside tested flows; do not treat route rendering as full feature parity.
