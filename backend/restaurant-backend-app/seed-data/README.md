# DynamoDB seed data

These files contain sample locations and dishes in the DynamoDB `batch-write-item` request format.
The dish `locationId` values refer to IDs in `locations.json`.

The two records that used `Fats` have been normalized to `fats`, matching the `Dish` entity.

## Import into the development account

Run these commands from `backend/restaurant-backend-app` after confirming that the active AWS CLI
profile points to the intended development account and region:

```powershell
aws sts get-caller-identity
aws dynamodb batch-write-item --request-items file://seed-data/locations.json --region eu-north-1
aws dynamodb batch-write-item --request-items file://seed-data/dishes.json --region eu-north-1
```

Import locations first, then dishes. DynamoDB `PutRequest` replaces an existing item with the same
ID, so these commands are safe for the current empty tables but can overwrite matching IDs if run
again after records have changed. They do not delete other records.

These seed files populate only the `Locations` and `Dishes` tables. They do not create reservations,
group reservations, guest sessions, users, or orders needed to exercise a complete group-order flow.
