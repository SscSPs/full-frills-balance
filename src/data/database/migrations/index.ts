import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations'

export const migrations = schemaMigrations({
  migrations: [
    // Version 1 is the initial schema
    {
      toVersion: 1,
      steps: [
        // No steps needed here as the schema is defined in schema.ts
      ],
    },
    // Future migrations would be added here
    // {
    //   toVersion: 2,
    //   steps: [
    //     // Migration steps
    //   ],
    // },
  ],
})
