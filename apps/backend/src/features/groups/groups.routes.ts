// Fitur: endpoint kelompok
import { Elysia } from "elysia";
import { authGuard, requireRole } from "../../shared/middleware/auth";
import { ok } from "../../shared/utils/response";
import * as groupsService from "./groups.service";
import { createGroupSchema, joinGroupSchema, leaveGroupSchema, inviteGroupSchema, updateGroupSchema } from "./groups.schema";

export const groupRoutes = new Elysia({ prefix: "/groups" })
  .use(authGuard)
  .get("/class/:classId", async ({ params }) => ok(await groupsService.getClassGroups(params.classId)))
  .guard({ beforeHandle: requireRole("student") }, (app) =>
    app
      .get("/my", async ({ user }) => ok(await groupsService.getStudentGroups(user.id)))
      .post("", async ({ user, body }) => ok(await groupsService.createGroup(user.id, body)), { body: createGroupSchema })
      .post("/join", async ({ user, body }) => ok(await groupsService.joinGroup(user.id, body)), { body: joinGroupSchema })
      .post("/invite", async ({ user, body }) => ok(await groupsService.inviteStudent(user.id, body)), { body: inviteGroupSchema })
      .post("/leave", async ({ user, body }) => ok(await groupsService.leaveGroup(user.id, body)), { body: leaveGroupSchema })
      .delete("/leave", async ({ user, body }) => ok(await groupsService.leaveGroup(user.id, body)), { body: leaveGroupSchema })
      .patch("/:groupId", async ({ user, params, body }) => ok(await groupsService.updateGroup(user.id, params.groupId, body.name)), { body: updateGroupSchema })
      .put("/:groupId", async ({ user, params, body }) => ok(await groupsService.updateGroup(user.id, params.groupId, body.name)), { body: updateGroupSchema })
  );
