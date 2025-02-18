export const COMMENT_POPULATE_CONFIG = {
  path: "comments",
  populate: [
    {
      path: "userId",
      select: "name profileImage",
    },
    {
      path: "replyTo",
      populate: [
        {
          path: "userId",
          select: "name profileImage",
        },
        {
          path: "replyTo",
          populate: [
            {
              path: "userId",
              select: "name profileImage",
            },
          ],
        },
      ],
    },
  ],
};
