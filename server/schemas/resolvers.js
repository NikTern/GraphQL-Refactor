// import user model
const { User } = require('../models');
// import sign token function from auth
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
  // get a single user by either their id or their username
    // getSingleUser: async (parent, { id, username }, context) => {
    //   const user = context.user || null;

    //   const foundUser = await User.findOne({
    //     $or: [{ _id: user ? user._id : id }, { username }],
    //   });

    //   if (!foundUser) {
    //     throw new UserInputError('Cannot find a user with this id!');
    //   }

    //   return foundUser;
    // },

    //change:the query should return the current user (from context) when no arguments are passed:
    me: async (parent, { id, username }, context) => {
      if (!id && !username && context.user) {
        return context.user;
      }
    
      const foundUser = await User.findOne({
        $or: [{ _id: id }, { username }],
      });
    
      if (!foundUser) {
        throw new UserInputError('Cannot find a user with this id!');
      }
    
      return foundUser;
    },
    
  },
  
  Mutation: {
      // create a user, sign a token, and send it back (to client/src/components/SignUpForm.js)
    createUser: async (parent, { input }) => {
      const user = await User.create(input);

      if (!user) {
        throw new UserInputError('Something is wrong!');
      }

      const token = signToken(user);
      return { token, user };
    },

  // login a user, sign a token, and send it back (to client/src/components/LoginForm.js)
    login: async (parent, { input }) => {
      const user = await User.findOne({ $or: [{ username: input.username }, { email: input.email }] });

      if (!user) {
        throw new AuthenticationError("Can't find this user");
      }

      const correctPw = await user.isCorrectPassword(input.password);

      if (!correctPw) {
        throw new AuthenticationError('Wrong password!');
      }

      const token = signToken(user);
      return { token, user };
    },

  // save a book to a user's `savedBooks` field by adding it to the set (to prevent duplicates)
    saveBook: async (parent, { input }, context) => {
      if (!context.user) {
        throw new AuthenticationError('You need to be logged in!');
      }

      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: input } },
          { new: true, runValidators: true }
        );
        return updatedUser;
      } catch (err) {
        throw new UserInputError(err.message);
      }
    },

// remove a book from `savedBooks`
    deleteBook: async (parent, { bookId }, context) => {
      if (!context.user) {
        throw new AuthenticationError('You need to be logged in!');
      }

      const updatedUser = await User.findOneAndUpdate(
        { _id: context.user._id },
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      );

      if (!updatedUser) {
        throw new UserInputError("Couldn't find user with this id!");
      }

      return updatedUser;
    },
  },
};

module.exports = resolvers;