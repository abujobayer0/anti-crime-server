import { Router } from "express";
import { CommentController } from "./comment.controller";
import { userRole } from "../Auth/auth.utils";
import Auth from "../../middlewares/auth";
import { clearCache } from "../../middlewares/cache.redis";
const router = Router();

router.post(
  "/:reportId/comment",
  Auth(userRole.user, userRole.admin),
  clearCache("crime-reports"),
  CommentController.createComment
);
router.patch(
  "/:commentId/update",
  Auth(userRole.user, userRole.admin),
  clearCache("crime-reports"),
  CommentController.updateComment
);
router.delete(
  "/:commentId/delete",
  Auth(userRole.user, userRole.admin),
  clearCache("crime-reports"),
  CommentController.deleteComment
);

export const CommentRoutes = router;
