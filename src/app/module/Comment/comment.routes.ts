import { Router } from "express";
import { CommentController } from "./comment.controller";
import { userRole } from "../Auth/auth.utils";
import Auth from "../../middlewares/auth";

const router = Router();

router.post(
  "/:reportId/comment",
  Auth(userRole.admin, userRole.user),
  CommentController.createComment
);
router.patch(
  "/:commentId/update",
  Auth(userRole.admin, userRole.user),
  CommentController.updateComment
);
router.delete(
  "/:commentId/delete",
  Auth(userRole.admin, userRole.user),
  CommentController.deleteComment
);

export const CommentRoutes = router;
