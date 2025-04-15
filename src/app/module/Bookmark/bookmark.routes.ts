import { Router } from "express";
import { userRole } from "../Auth/auth.utils";
import Auth from "../../middlewares/auth";
import { BookmarkController } from "./bookmark.controller";
const router = Router();

router.get(
  "/",
  Auth(userRole.user, userRole.admin),
  BookmarkController.getBookmarks
);
router.get(
  "/reportId",
  Auth(userRole.user, userRole.admin),
  BookmarkController.checkBookmarked
);

router.post(
  "/:reportId",
  Auth(userRole.user, userRole.admin),
  BookmarkController.createBookmark
);

router.delete(
  "/:bookmarkId",
  Auth(userRole.user, userRole.admin),
  BookmarkController.deleteBookmark
);

export const BookmarkRoutes = router;
