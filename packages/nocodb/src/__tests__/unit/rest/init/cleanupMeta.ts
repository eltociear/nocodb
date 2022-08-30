import Model from '../../../../lib/models/Model';
import Project from '../../../../lib/models/Project';
import { orderedMetaTables } from '../../../../lib/utils/globals';

const dropTablesAllProjects = async (knexClient) => {
  const projects = await Project.list({});
  const userCreatedTableNames = [];
  await Promise.all(
    projects.map(async (project) => {
      await project.getBases();
      const base = project.bases && project.bases[0];
      if (!base) return;

      const models = await Model.list({
        project_id: project.id,
        base_id: base.id,
      });
      models.forEach((model) => {
        userCreatedTableNames.push(model.table_name);
      });
    })
  );

  await Promise.all(
    userCreatedTableNames.map(async (tableName) => {
      await knexClient.raw(`DROP TABLE ${tableName}`);
    })
  );
};

const cleanupMetaTables = async (knexClient) => {
  await knexClient.raw('SET FOREIGN_KEY_CHECKS = 0');
  for (const tableName of orderedMetaTables) {
    try {
      await knexClient.raw(`DELETE FROM ${tableName}`);
    } catch (e) {}
  }
  await knexClient.raw('SET FOREIGN_KEY_CHECKS = 1');
};

export default async function (knexClient) {
  try {
    await dropTablesAllProjects(knexClient);
    await cleanupMetaTables(knexClient);
  } catch (e) {
    console.error('cleanupMeta', e);
  }
}
