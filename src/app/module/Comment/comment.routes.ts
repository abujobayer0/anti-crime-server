import { Router } from "express";
import { CommentController } from "./comment.controller";
import { userRole } from "../Auth/auth.utils";
import Auth from "../../middlewares/auth";
const router = Router();

router.post(
  "/:reportId/comment",
  Auth(userRole.user, userRole.admin),
  CommentController.createComment
);
router.patch(
  "/:commentId/update",
  Auth(userRole.user, userRole.admin),
  CommentController.updateComment
);
router.delete(
  "/:commentId/delete",
  Auth(userRole.user, userRole.admin),
  CommentController.deleteComment
);

export const CommentRoutes = router;
