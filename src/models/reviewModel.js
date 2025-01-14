const mongoose = require('mongoose');
const Dummy = require('./dummyModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    dummy: {
      type: mongoose.Schema.ObjectId,
      ref: 'Dummy',
      required: [true, 'Review must belong to a dummy'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ dummy: 1, user: 1 }, { unique: true});

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  })
  next();
});

// this is a static method, so it is called on the model
reviewSchema.statics.calcAverageRatings = async function (dummyId) {
  const stats = await this.aggregate([
    {
      $match: { dummy: dummyId },
    },
    {
      $group: {
        _id: '$dummy',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Dummy.findByIdAndUpdate(dummyId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  }else {
    await Dummy.findByIdAndUpdate(dummyId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
}

reviewSchema.post('save', async function () {
  await this.constructor.calcAverageRatings(this.dummy);
})

reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.dummy);
  }
})

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
