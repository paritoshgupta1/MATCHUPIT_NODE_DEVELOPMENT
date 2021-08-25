const checkWord = require("../helpers/swearjar");
const Community = require("../models/schemas/community");
const User = require("../models/user");
const Corporate = require("../models/corporate");
const Post = require("../models/schemas/post");
const models = require("../models/index");
const _ = require('lodash');
const mongoose = require('mongoose');

const sendResponse = require("../helpers/response_handler").sendResponse;
const responseObj = require("../helpers/response_handler").responseObj;

const createCommunity = async (req, res) => {
  try {
    const { title, description, roles } = req.body;

    if (!title || !description) {
      sendResponse(
        {
          err: true,
          responseCode: 400,
          msg: "title, description are mandatory",
        },
        res
      );
    }

    if (checkWord(title) || checkWord(description)) {
      return sendResponse(
        {
          err: true,
          responseCode: 400,
          msg: "title, description contains abusive words",
        },
        res
      );
    }
    let community = new Community({
      title: title.trim(),
      description: description.trim(),
      roles: roles.trim(),
      is_active: true,
      createdBy: req.headers.userid,
      createdOn: new Date()
    });

    await community.save();

    return sendResponse(
      {
        err: false,
        responseCode: 200,
        msg: "community created",
      },
      res
    );
  } catch (ex) {
    console.log(ex);
    // return responseObj(true, 500, ex.stack);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "error creating community",
        err_stack: ex.stack
      },
      res
    );
  }
};

const joinCommunity = async (req, res) => {
  try {
    const { communityId } = req.body;

    if (!communityId) {
      sendResponse(
        {
          err: true,
          responseCode: 400,
          msg: "communityId is mandatory",
        },
        res
      );
    }

    let userCount = await models.usercommunity.count({
      where: {
        userId: req.headers.userid,
      },
    });
    if (userCount >= 10) {
      return sendResponse(
        {
          err: false,
          responseCode: 400,
          msg: "User cannot be added to more than five communities",
        },
        res
      );
    }

    let userExist = await models.usercommunity.findOne({
      where: {
        userId: req.headers.userid,
        communityId,
      },
    });

    if (!userExist) {
      await models.usercommunity.create({
        userId: req.headers.userid,
        communityId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await Community.findOneAndUpdate(
        {
          _id: communityId,
        },
        {
          $inc: {
            userCount: 1,
          },
        }
      );

      return sendResponse(
        {
          err: false,
          responseCode: 200,
          msg: "User Added to the commmunity",
        },
        res
      );
    } else {
      return sendResponse(
        {
          err: true,
          responseCode: 400,
          msg: "User already member to this commmunity",
        },
        res
      );
    }
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "error in joining community",
        err_stack: ex.stack
      },
      res
    );
  }
};

const addPost = async (req, res) => {
  try {
    const { title, description, communityId, tags } = req.body;

    if (!title || !description || !communityId || !tags) {
      responseObj(
        true,
        400,
        "title, description, communityId, tags are mandatory"
      );
    }

    if (checkWord(title) || checkWord(description)) {
      return responseObj(
        true,
        200,
        "title or desription comtains abusive words",
        community
      );
    }
    let postObj;
    if (req.body.attachments) {
      postObj = {
        attachments: req.body.attachments,
        title: title.trim(),
        description: description.trim(),
        communityId,
        tags: tags.map((x) => x.trim()),
        createdBy: req.headers.userid,
        createdOn: new Date(),
        isActive: true
      };
    } else {
      postObj = {
        title: title.trim(),
        description: description.trim(),
        communityId,
        tags: tags.map((x) => x.trim()),
        createdBy: req.headers.userid,
        createdOn: new Date(),
        isActive: true
      };
    }

    let newPost = new Post(postObj);
    let post = await newPost.save();

    return sendResponse(
      {
        err: false,
        responseCode: 200,
        msg: "post Added to the commmunity",
        post
      },
      res
    );
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "error in adding post",
        err_stack: ex.stack
      },
      res
    );
  }
};

const addComment = async (req, res) => {
  try {
    let { text, postId } = req.body;

    if (checkWord(text.trim())) {
      return sendResponse(
        {
          err: true,
          responseCode: 400,
          msg: "text contains abusive words",
        },
        res
      );
    }

    let post = await Post.findById(postId);

    if (!post) {
      return sendResponse(
        {
          err: false,
          responseCode: 400,
          msg: "Post not found with given Id",
        },
        res
      );
    }

    let newComment;
    let user, corporate;
    user = await User.findOne({
      where:{
        id: req.headers.userid
      },
      attributes: ["profile_pic", "first_name", "last_name"]

    })
    if(!user) {
      corporate = await Corporate.findOne({
        where:{
          id: req.headers.userid
        },
        attributes: ["name", "logo"]
  
      })
    }
    if (req.body.attachments) {
      newComment = {
        user: req.headers.userid,
        text: text.trim(),
        createdOn: new Date(),
        attachments: req.body.attachments,
        profilePic: user ? user.profile_pic : corporate.logo
      }
    } else {
      newComment = {
        user: req.headers.userid,
        text: text.trim(),
        createdOn: new Date(),
        profilePic: user ? user.profile_pic : corporate.logo
      };
    }

    post.comments.push(newComment);

    let AddComment = await post.save();

    let comment1 = AddComment.comments.slice(-1)[0];

    let comment = JSON.parse(JSON.stringify(comment1))

    comment["name"] = user ? user["first_name"] +  " "  + user["last_name"] : corporate["name"]

    return sendResponse(
      {
        err: false,
        responseCode: 200,
        msg: "Comment Added",
        comment
      },
      res
    );
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "error in adding comment",
        err_stack: ex.stack
      },
      res
    );
  }
};

const getPosts = async (req, res) => {
  try {
    let { communityId } = req.query;
    const { account_type } = req.tokenUser.data;

    if (!communityId) {
      sendResponse(
        {
          err: true,
          responseCode: 400,
          msg: "communityId is mandatory",
        },
        res
      );
    }

    if (account_type === "individual") {
      let community = await Community.findById(communityId, {
        title: 1,
        description: 1,
      });
      let posts1 = await Post.find({ communityId, isActive: true }).sort({ createdOn: "desc" });

      let posts = JSON.parse(JSON.stringify(posts1));
      for (let i of posts) {
        for (let j of i.comments) {
          let user = await User.findOne({
            where: { id: j.user },
            attributes: ["first_name", "last_name", "profile_pic"],
          });
          if(user) {
            j["name"] = user.first_name + " " + user.last_name;
            j["profilePic"] = user.profile_pic;
          }
          else {
            let corp = await Corporate.findOne({
              where: { id: j.user },
              attributes: ["name", "logo", "logo"],
            });
            j["name"] = corp.name;
            j["profilePic"] = corp.logo;
          }
        }
        let name = await User.findOne({
          where: {
            id: i.createdBy,
          },
          attributes: ["first_name", "last_name", "profile_pic"],
        });
        if(name) {
          i["name"] = name.first_name + " " + name.last_name;
          i["profilePic"] = name.profile_pic;
  
          let isMember = i.createdBy === req.headers.userid ? true : false;
          i["myPost"] = isMember;
        }
        else {
          let corpName = await Corporate.findOne({
            where: {
              id: i.createdBy,
            },
            attributes: ["name", "logo"],
          });
          i["name"] = corpName.name;
          i["profilePic"] = corpName.logo;
        }
      }

      let userExist = await models.usercommunity.findOne({
        where: {
          userId: req.headers.userid,
          communityId,
        },
      });
      return sendResponse(
        {
          err: false,
          responseCode: 200,
          communityName: community.title,
          communityDescription: community.description,
          posts,
          isMember: userExist ? true : false,
        },
        res
      );
    } else {
      let community = await Community.findById(communityId, {
        title: 1,
        description: 1,
      });
      let posts1 = await Post.find({ communityId }).sort({createdOn: 'desc'});

      let posts = JSON.parse(JSON.stringify(posts1));
      for (let i of posts) {
        for (let j of i.comments) {
          let user = await User.findOne({
            where: { id: j.user },
            attributes: ["first_name", "last_name", "profile_pic"],
          });
          if(user) {
            j["name"] = user.first_name + " " + user.last_name;
            j["profilePic"] = user.profile_pic;
          }
          else {
            let corp = await Corporate.findOne({
              where: { id: j.user },
              attributes: ["name", "logo"],
            });
            j["name"] = corp.name;
            j["profilePic"] = corp.logo;
          }
        }
        let name = await User.findOne({
          where: {
            id: i.createdBy,
          },
          attributes: ["first_name", "last_name", "profile_pic"],
        });
        if(name) {
          i["name"] = name.first_name + " " + name.last_name;
          i["profilePic"] = name.profile_pic;
        }
        else {
          let corpName = await Corporate.findOne({
            where: {
              id: i.createdBy,
            },
            attributes: ["name", "logo"],
          });
          i["name"] = corpName.name;
          i["profilePic"] = corpName.logo;
        }
      }

      return sendResponse(
        {
          err: false,
          responseCode: 200,
          communityName: community.title,
          communityDescription: community.description,
          posts,
        },
        res
      );
    }
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "error in getting posts",
        err_stack: ex.stack
      },
      res
    );
  }
};

const editCommunity = async (req, res) => {
  try {
    let { communityId, title, description } = req.body;


    if (!title || !description || !communityId) {
      sendResponse(
        {
          err: true,
          responseCode: 400,
          msg: "title, description, communityId are mandatory",
        },
        res
      );
    }

    let community = await Community.findById(communityId);

    if (!community) {
      return res.status(200).json({
        err: true,
        msg: "Community not created",
      });
    }

    if (checkWord(title) || checkWord(description)) {
      return sendResponse(
        {
          err: true,
          responseCode: 400,
          msg: "title, description contains abusive words",
        },
        res
      );
    }

    let communityObj = {
      title: title.trim(),
      description: description.trim(),
    };

    await Community.findOneAndUpdate({ _id: communityId }, communityObj);

    return res.status(200).json({
      err: false,
      msg: "Community updated",
    });
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "error in updating community",
        err_stack: ex.stack
      },
      res
    );
  }
};

const addReactToPost = async (req, res) => {
  try {
    let { postId, type } = req.body;

    let post = await Post.findById(postId);

    if (!post) {
      return res.status(200).json({
        err: true,
        msg: "post not created",
      });
    }

    if (type === "like") {
      if (
        post.postEmojis.likes.filter(
          (userId) => userId.toString() === req.headers.userid
        ).length > 0
      ) {
        return sendResponse(
          {
            err: false,
            responseCode: 400,
            msg: "Post already liked",
          },
          res
        );
      }

      post.postEmojis.likes.unshift(req.headers.userid);

      await post.save();

      return sendResponse(
        {
          err: false,
          responseCode: 200,
          msg: "Post Liked",
        },
        res
      );
    } else if (type === "dislike") {
      if (
        post.postEmojis.dislikes.filter(
          (userId) => userId.toString() === req.headers.userid
        ).length > 0
      ) {
        return sendResponse(
          {
            err: false,
            responseCode: 400,
            msg: "Post already disliked",
          },
          res
        );
      }

      post.postEmojis.dislikes.unshift(req.headers.userid);

      await post.save();

      return sendResponse(
        {
          err: false,
          responseCode: 200,
          msg: "Post Disliked",
        },
        res
      );
    } else if (type === "applaud") {
      if (
        post.postEmojis.applauds.filter(
          (userId) => userId.toString() === req.headers.userid
        ).length > 0
      ) {
        return sendResponse(
          {
            err: false,
            responseCode: 400,
            msg: "Post already applauded",
          },
          res
        );
      }

      post.postEmojis.applauds.unshift(req.headers.userid);

      await post.save();

      return sendResponse(
        {
          err: false,
          responseCode: 200,
          msg: "Post Applauded",
        },
        res
      );
    } else {
      return sendResponse(
        {
          err: false,
          responseCode: 400,
          msg: "Incorrect type",
        },
        res
      );
    }
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "error in adding react",
        err_stack: ex.stack
      },
      res
    );
  }
};

const addDislikeToPost = async (req, res) => {
  try {
    let { postId } = req.body;

    let post = await Post.findById(postId);

    if (!post) {
      return res.status(200).json({
        err: true,
        msg: "post not created",
      });
    }

    if (
      post.postEmojis.dislikes.filter(
        (userId) => userId.toString() === req.headers.userid
      ).length > 0
    ) {
      return sendResponse(
        {
          err: false,
          responseCode: 400,
          msg: "Post already disliked",
        },
        res
      );
    }

    post.postEmojis.dislikes.unshift(req.headers.userid);

    await post.save();

    return sendResponse(
      {
        err: false,
        responseCode: 200,
        msg: "Post Disliked",
      },
      res
    );
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "error in disliking post",
        err_stack: ex.stack
      },
      res
    );
  }
};


const addApplaudToPost = async (req, res) => {
  try {
    let { postId } = req.body;

    let post = await Post.findById(postId);

    if (!post) {
      return res.status(200).json({
        err: true,
        msg: "post not created",
      });
    }

    if (
      post.postEmojis.applauds.filter(
        (userId) => userId.toString() === req.headers.userid
      ).length > 0
    ) {
      return sendResponse(
        {
          err: false,
          responseCode: 400,
          msg: "Post already applauded",
        },
        res
      );
    }

    post.postEmojis.applauds.unshift(req.headers.userid);

    await post.save();

    return sendResponse(
      {
        err: false,
        responseCode: 200,
        msg: "Post Applauded",
      },
      res
    );
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "error in uploading post",
        err_stack: ex.stack
      },
      res
    );
  }
};


const getCommunities = async (req, res) => {
  try {
    const { account_type } = req.tokenUser.data;
    const { limit, page, isMember } = req.query;
    const limit1 = limit ? limit : 9;
    const page1 = Number(page) || 1;
    const offset = (page1 - 1) * limit1;

    if (account_type === "admin") {
      // let communities = await Community.find().limit(Number(limit1)).skip(offset).sort({createdOn: 'desc'});
      let communities = await Community.find().sort({ createdOn: 'desc' });
      let count = await Community.find().countDocuments();

      if (communities.length > 0) {
        let communties1 = JSON.parse(JSON.stringify(communities))
        for(let i of communties1){
          let user = await User.findOne({
            where: { id: i.createdBy },
            attributes: ["first_name", "last_name"],
          });
          i["name"] = user.first_name + " " + user.last_name;
        }

        return res.status(200).json({
          err: false,
          status: 200,
          data: communties1,
          count
        });
      } else {
        return res.status(200).json({
          err: false,
          status: 200,
          // msg: "There are no communties",
          data: [],
          count: 0
        });
      }
    } else if (account_type === "individual") {
      if (isMember && isMember !== "false") {
        let usercommunities = await models.usercommunity.findAll({
          where: {
            userId: req.headers.userid,
          },
          attributes: ["communityId"],
          limit: 10
        });

        if (usercommunities.length > 0) {
          let resultArray = []

          for (let community of usercommunities) {

            let community1 = await Community.findById(community.communityId)
            let communityData = JSON.parse(JSON.stringify(community1));
            let user = await User.findOne({
              where: { id: communityData.createdBy },
              attributes: ["first_name", "last_name"],
            });
            communityData["name"] = user.first_name + " " + user.last_name;
            communityData["isMember"] = true;

            let posts = await Post.find({ communityId: communityData._id }, { createdBy: 1, isActive: 1 });

            if (posts.length > 0) {
              let hasPosted = posts.find(post => post.createdBy === req.headers.userid && post.isActive === true);
              communityData["hasPosted"] = hasPosted ? true : false;
            } else {
              communityData["hasPosted"] = false;
            }
            resultArray.push(communityData)

          }

          return res.status(200).json({
            err: false,
            status: 200,
            data: resultArray.sort((x, y) => {
              let c = new Date(x.createdOn);
              let d = new Date(y.createdOn);
              return d - c;
            }),
          });
        }
        else {
          return res.status(200).json({
            err: false,
            status: 200,
            data: []
          });
        }

      }
      else {
        let limit = 6;
        let page1 = Number(page) || 1;
        let offset = (page1 - 1) * limit;

        let usercommunities = await models.usercommunity.findAll({
          where: {
            userId: req.headers.userid,
          },
          attributes: ["communityId"],
          limit: 5
        });
        let communityArray = usercommunities.map(community=> mongoose.Types.ObjectId(community.communityId))

        let communities1 = await Community.find({ is_active: 1, "_id": { "$nin": communityArray } }).limit(limit).skip(offset).sort({ createdOn: 'desc' })

        let count = await Community.find({ is_active: 1, "_id": { "$nin": communityArray } }).sort({ createdOn: 'desc' }).countDocuments();
  
        let communities = JSON.parse(JSON.stringify(communities1));
  
        for (let i of communities) {
          let userExist = await models.usercommunity.findOne({
            where: {
              userId: req.headers.userid,
              communityId: i._id,
            },
          });
          let user = await User.findOne({
            where: { id: i.createdBy },
            attributes: ["first_name", "last_name"],
          });
          i["name"] = user.first_name + " " + user.last_name;
          if (userExist) {
            i.isMember = true;
          }
          else {
            i.isMember = false;
          }
          let posts = await Post.find({ communityId: i._id }, { createdBy: 1 });
          
          if (posts.length > 0) {
            let hasPosted = posts.find(post => post.createdBy === req.headers.userid);
            i["hasPosted"] = hasPosted ? true : false;
          } else {
            i["hasPosted"] = false;
          }
        }
  
        return res.status(200).json({
          err: false,
          status: 200,
          data: communities,
          count
        });
      }
    } else {
      let communities1 = await Community.find({ is_active: 1 }).limit(Number(limit1)).skip(offset).sort({createdOn: 'desc'});
      let count = await Community.find({ is_active: 1 }).countDocuments();
      let communities = JSON.parse(JSON.stringify(communities1));

      for(let i of communities){
        let user = await User.findOne({
          where: { id: i.createdBy },
          attributes: ["first_name", "last_name"],
        });
        i["name"] = user.first_name + " " + user.last_name;
      }

      return res.status(200).json({
        err: false,
        status: 200,
        data: communities,
        count
      });
    }
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "error in getting communities",
        err_stack: ex.stack
      },
      res
    );
  }
};

const toggleCommunity = async (req, res) => {
  try {
    const { communityId } = req.body;
    const { account_type } = req.tokenUser.data;

    if (!communityId) {
      sendResponse(
        {
          err: true,
          responseCode: 400,
          msg: "communityId is mandatory",
        },
        res
      );
    }

    if (account_type === "admin") {
      let community = await Community.findById(communityId);

      let is_active = community.is_active ? false : true;

      let communityObj = {
        is_active,
      };

      if (community) {
        await Community.findOneAndUpdate({ _id: communityId }, communityObj);

        return res.status(200).json({
          err: false,
          status: 200,
          msg: is_active ? "Community Successfully Activated": "Community Successfully Deactivated",
        });
      } else {
        return res.status(200).json({
          err: false,
          status: 200,
          msg: "There is no community",
        });
      }
    } else {
      return res.status(200).json({
        err: false,
        status: 401,
        msg: "Only admins can delete community",
      });
    }
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "error in toggling community",
        err_stack: ex.stack
      },
      res
    );
  }
};


const leaveCommunity = async (req, res) => {
  try {
    const { communityId } = req.body;
    const { account_type } = req.headers.userid;

    if (!communityId) {
      sendResponse(
        {
          err: true,
          responseCode: 400,
          msg: "communityId is mandatory",
        },
        res
      );
    }

    await models.usercommunity.destroy({
      where: {
        userId: req.headers.userid,
        communityId,
      },
    });

    await Community.findOneAndUpdate(
      {
        _id: communityId,
      },
      {
        $inc: {
          userCount: -1,
        },
      }
    );

    return sendResponse(
      {
        err: false,
        responseCode: 200,
        msg: "User removed from the commmunity",
      },
      res
    );
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "error in removing user from community",
        err_stack: ex.stack
      },
      res
    );
  }
};


const deleteCommunity1 = async (req, res) => {
  try {
    await Community.deleteMany();

    return sendResponse(
      {
        err: false,
        responseCode: 200,
        msg: "Community deleted",
      },
      res
    );
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "error in deleting community",
        err_stack: ex.stack
      },
      res
    );
  }
};


const deletePost = async (req, res) => {
  try {
    let { postId } = req.body;
    const { account_type } = req.tokenUser.data;

    if (!postId) {
      sendResponse(
        {
          err: true,
          responseCode: 400,
          msg: "postId is mandatory",
        },
        res
      );
    }

    let post = await Post.findOne({ _id: postId }, { createdBy: 1 });

    if (!post) {
      sendResponse(
        {
          err: true,
          responseCode: 404,
          msg: "post not found with given ID",
        },
        res
      );
    }

    if (post.createdBy === req.headers.userid || account_type === "admin") {

      await Post.findOneAndUpdate({ _id: postId }, { isActive: false });
      
    } else {
      sendResponse(
        {
          err: true,
          responseCode: 403,
          msg: "User doesn't have access",
        },
        res
      );
    }

    sendResponse(
      {
        err: false,
        responseCode: 200,
        msg: "post deleted",
      },
      res
    );
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "error in deleting post",
        err_stack: ex.stack
      },
      res
    );
  }
};



const editPost = async (req, res) => {
  try {
    const { title, description, postId } = req.body;
    const { account_type } = req.tokenUser.data;

    if (!title || !description || !postId) {
      responseObj(
        true,
        400,
        "title, description, communityId, tags are mandatory"
      );
    }
    let post1 = await Post.findById(postId);

    if (!post1) {
      return sendResponse(
        {
          err: true,
          responseCode: 400,
          msg: "Post not found with given Id",
        },
        res
      );
    }

    if (post1.createdBy === req.headers.userid || account_type === "admin") {
      if (checkWord(title) || checkWord(description)) {
        return responseObj(
          true,
          200,
          "title or desription contains abusive words",
          community
        );
      }

      let postObj;
      if (req.body.attachments) {
        postObj = {
          attachments: req.body.attachments,
          title: title.trim(),
          description: description.trim(),
          tags: req.body.tags ? req.body.tags.map((x) => x.trim()) : [],
          createdBy: req.headers.userid,
          createdOn: new Date(),
          isActive: true,
        };
      } else {
        postObj = {
          title: title.trim(),
          description: description.trim(),
          tags: req.body.tags ? req.body.tags.map((x) => x.trim()) : [],
          createdBy: req.headers.userid,
          createdOn: new Date(),
          isActive: true,
        };
      }

      let post = await Post.findByIdAndUpdate({ _id: postId }, postObj);

      return sendResponse(
        {
          err: false,
          responseCode: 200,
          msg: "post updated successfully",
          post,
        },
        res
      );
    }
    else {
      sendResponse(
        {
          err: true,
          responseCode: 403,
          msg: "User does not have access",
        },
        res
      );
    }
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "error in editing post",
        err_stack: ex.stack
      },
      res
    );
  }
};



const addReactToComment = async (req, res) => {
  try {
    const { postId, commentId, type } = req.body;

    if (!commentId || !postId || !type) {
      responseObj(true, 400, "commentId, postId, type are mandatory");
    }
    let post = await Post.findById(postId, { comments: 1 });

    if (!post) {
      return sendResponse(
        {
          err: true,
          responseCode: 400,
          msg: "Post not found with given Id",
        },
        res
      );
    }

    let comment = post.comments.find(
      (comment) => comment._id.toString() === commentId
    );


    if (!comment) {
      return sendResponse(
        {
          err: false,
          responseCode: 200,
          msg: "No comment found with given commentId",
          post,
        },
        res
      );
    }

    if(type=== 'like'){

      let isAlreadyLiked = comment.commentEmojis.likes.find(userId =>
        userId === req.headers.userid
      );
  
      if (isAlreadyLiked) {
        return sendResponse(
          {
            err: true,
            responseCode: 400,
            msg: "comment already liked"
          },
          res
        );
      } else {
        comment.commentEmojis.likes.push(req.headers.userid);
  
        await post.save();
  
        return sendResponse(
          {
            err: false,
            responseCode: 200,
            msg: "comment liked",
            post,
          },
          res
        );
      }
    }
    else if(type === 'dislike') {

      let isAlreadyDisliked = comment.commentEmojis.dislikes.find(userId =>
        userId === req.headers.userid
      );
  
      if (isAlreadyDisliked) {
        return sendResponse(
          {
            err: true,
            responseCode: 400,
            msg: "comment already disliked"
          },
          res
        );
      } else {
        comment.commentEmojis.dislikes.push(req.headers.userid);
  
        await post.save();
  
        return sendResponse(
          {
            err: false,
            responseCode: 200,
            msg: "comment disliked",
            post,
          },
          res
        );
      }


    }
    else if(type === 'applaud'){
      let isAlreadyApplauded = comment.commentEmojis.applauds.find(userId =>
        userId === req.headers.userid
      );
  
      if (isAlreadyApplauded) {
        return sendResponse(
          {
            err: true,
            responseCode: 400,
            msg: "comment already applauded"
          },
          res
        );
      } else {
        comment.commentEmojis.applauds.push(req.headers.userid);
  
        await post.save();
  
        return sendResponse(
          {
            err: false,
            responseCode: 200,
            msg: "comment applauded",
            post,
          },
          res
        );
      }

    }

    else {
      return sendResponse(
        {
          err: true,
          responseCode: 400,
          msg: "type is invalid",
          post,
        },
        res
      );

    }

  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "error in adding react to comment",
        err_stack: ex.stack
      },
      res
    );
  }
};


const addDislikeToComment = async (req, res) => {
  try {
    const { postId, commentId } = req.body;

    if (!commentId || !postId) {
      responseObj(true, 400, "commentId, postId are mandatory");
    }
    let post = await Post.findById(postId, { comments: 1 });

    if (!post) {
      return sendResponse(
        {
          err: true,
          responseCode: 400,
          msg: "Post not found with given Id",
        },
        res
      );
    }

    let comment = post.comments.find(
      (comment) => comment._id.toString() === commentId
    );

    if (!comment) {
      return sendResponse(
        {
          err: false,
          responseCode: 200,
          msg: "No comment found with given commentId",
          post,
        },
        res
      );
    }

    let isAlreadyDisliked = comment.commentEmojis.dislikes.find(userId =>
      userId === req.headers.userid
    );

    if (isAlreadyDisliked) {
      return sendResponse(
        {
          err: true,
          responseCode: 400,
          msg: "comment already disliked"
        },
        res
      );
    } else {
      comment.commentEmojis.dislikes.push(req.headers.userid);

      await post.save();

      return sendResponse(
        {
          err: false,
          responseCode: 200,
          msg: "comment disliked",
          post,
        },
        res
      );
    }
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "error in adding dislike",
        err_stack: ex.stack
      },
      res
    );
  }
};


const addApplaudToComment = async (req, res) => {
  try {
    const { postId, commentId } = req.body;

    if (!commentId || !postId) {
      responseObj(true, 400, "commentId, postId are mandatory");
    }
    let post = await Post.findById(postId, { comments: 1 });

    if (!post) {
      return sendResponse(
        {
          err: true,
          responseCode: 400,
          msg: "Post not found with given Id",
        },
        res
      );
    }

    let comment = post.comments.find(
      (comment) => comment._id.toString() === commentId
    );

    if (!comment) {
      return sendResponse(
        {
          err: false,
          responseCode: 200,
          msg: "No comment found with given commentId",
          post,
        },
        res
      );
    }

    let isAlreadyApplauded = comment.commentEmojis.applauds.find(userId =>
      userId === req.headers.userid
    );

    if (isAlreadyApplauded) {
      return sendResponse(
        {
          err: true,
          responseCode: 400,
          msg: "comment already applauded"
        },
        res
      );
    } else {
      comment.commentEmojis.applauds.push(req.headers.userid);

      await post.save();

      return sendResponse(
        {
          err: false,
          responseCode: 200,
          msg: "comment applauded",
          post,
        },
        res
      );
    }
  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "error in applauding comment",
        err_stack: ex.stack
      },
      res
    );
  }
};

const isCommunityExists = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      sendResponse(
        {
          err: true,
          responseCode: 400,
          msg: "title is mandatory",
        },
        res
      );
    }

    let community = await Community.findOne({ title: title.trim() }, { title: 1 });

    if (community) {
      return sendResponse(
        {
          err: true,
          responseCode: 400,
          msg: "Community name already exists",
        },
        res
      );
    }


    return sendResponse(
      {
        err: false,
        responseCode: 200,
        msg: "Community is not exists"
      },
      res
    );

  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "error in finding community",
        err_stack: ex.stack
      },
      res
    );
  }
};


const getMyCommunities = async (req, res) => {

  try {

    let usercommunities = await models.usercommunity.findAll({
      where: {
        userId: req.headers.userid,
      },
      attributes: ["communityId"],
      limit: 5
    });

    if (usercommunities.length > 0) {
      let resultArray = []

      for (let community of usercommunities) {

        let community1 = await Community.findById(community.communityId)
        let communityData = JSON.parse(JSON.stringify(community1));
        let user = await User.findOne({
          where: { id: communityData.createdBy },
          attributes: ["first_name", "last_name"],
        });
        communityData["name"] = user.first_name + " " + user.last_name;
        communityData["isMember"] = true;
        console.log(user.first_name + " " + user.last_name);
        let posts = await Post.find({ communityId: communityData._id }, { createdBy: 1 });

        if (posts.length > 0) {
          let hasPosted = posts.find(post => post.createdBy === req.headers.userid);
          communityData["hasPosted"] = hasPosted ? true : false;
        } else {
          communityData["hasPosted"] = false;
        }
        resultArray.push(communityData)

      }

      return res.status(200).json({
        err: false,
        status: 200,
        data: resultArray
      });
    }
    else {
      return res.status(200).json({
        err: false,
        status: 200,
        data: []
      });

    }

  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "error in getting communities",
        err_stack: ex.stack
      },
      res
    );
  }
};

const getTopCommunities = async (req, res) => {

  try {

    let communities = await Post.aggregate([{
      $group: {
        _id: {
          communityId: '$communityId'
        },
        data: { $sum: 1 }
      }
    },
    { $sort: { data: -1 } },
    {$limit: 5}
    ])
    let communityArray = [];

    if(communities.length >0){
      for (let i of communities){
        let community1 = await Community.findById(i._id.communityId);
        let community = JSON.parse(JSON.stringify(community1))

        let user = await User.findOne({
          where: { id: community.createdBy },
          attributes: ["first_name", "last_name"],
        });
        community["name"] = user ? user.first_name + " " + user.last_name : null;

        let posts = await Post.find({ communityId: community._id }, { createdBy: 1, comments: 1, isActive: 1  });
        let commentCount = posts.reduce((acc, currval) => {
          return currval.comments.length + acc;
        }, 0);
        community["postsCount"] = posts.length;
        community["commentCount"] = commentCount;

        if (posts.length > 0) {
          let hasPosted = posts.find(post => post.createdBy === req.headers.userid && post.isActive === true);
          community["hasPosted"] = hasPosted ? true : false;
        } else {
          community["hasPosted"] = false;
        }

        let userExist = await models.usercommunity.findOne({
          where: {
            userId: req.headers.userid,
            communityId: community._id,
          },
        });

        if (userExist) {
          community.isMember = true;
        }
        else {
          community.isMember = false;
        }

        communityArray.push(community)
      }
      return sendResponse(
        {
          err: false,
          responseCode: 200,
          data: communityArray,
        },
        res
      );
    }
    else {
      return sendResponse(
        {
          err: false,
          responseCode: 200,
          data: [],
        },
        res
      );
    }

  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "error in getting top communities",
        err_stack: ex.stack
      },
      res
    );
  }
};


const searchCommunities = async (req, res) => {

  try {

    const { communityName } = req.body;

    if (!communityName) {
      sendResponse(
        {
          err: true,
          responseCode: 400,
          msg: "communityName are mandatory",
        },
        res
      );
    }

    let communities = await Community.find({ $or: [{ "title": new RegExp(communityName, 'i') }, { "description": new RegExp(communityName, 'i') }] }, { title: 1, description: 1 })
    let count = await Community.find({ $or: [{ "title": new RegExp(communityName, 'i') }, { "description": new RegExp(communityName, 'i') }] }, { title: 1, description: 1 }).countDocuments();
    if (communities.length > 0) {
      // let communities = JSON.parse(JSON.stringify(communities1));

      // for(let i of communities){
      // let user = await User.findOne({
      //   where: { id: i.createdBy },
      //   attributes: ["first_name", "last_name"],
      // });
      // i["name"] = user.first_name + " " + user.last_name;

      // let posts = await Post.find({ communityId: i._id }, { createdBy: 1 });

      // if (posts.length > 0) {
      //   let hasPosted = posts.find(post => post.createdBy === req.headers.userid);
      //   i["hasPosted"] = hasPosted ? true : false;
      // } else {
      //   i["hasPosted"] = false;
      // }

      // let userExist = await models.usercommunity.findOne({
      //   where: {
      //     userId: req.headers.userid,
      //     communityId: i._id,
      //   },
      // });

      // if (userExist) {
      //   i.isMember = true;
      // }
      // else {
      //   i.isMember = false;
      // }
      // }

      return sendResponse(
        {
          err: false,
          responseCode: 200,
          data: communities,
          count
        },
        res
      );
    }
    else {
      return sendResponse(
        {
          err: true,
          responseCode: 200,
          data: [],
          count
        },
        res
      );
    }

  } catch (ex) {
    console.log(ex);
    return sendResponse(
      {
        err: true,
        responseCode: 500,
        msg: "error in searching communities",
        err_stack: ex.stack
      },
      res
    );
  }
};

module.exports = {
  createCommunity,
  joinCommunity,
  addPost,
  addComment,
  getPosts,
  editCommunity,
  addReactToPost,
  addDislikeToPost,
  addApplaudToPost,
  getCommunities,
  toggleCommunity,
  leaveCommunity,
  deleteCommunity1,
  deletePost,
  editPost,
  addReactToComment,
  isCommunityExists,
  getMyCommunities,
  getTopCommunities,
  searchCommunities
};
