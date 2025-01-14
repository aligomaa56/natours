const mongoose = require('mongoose');
const slugify = require('slugify');

const dummySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      unique: true,
      // validate: [validator.isAlpha, 'Name must only contain characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
    },
    discount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount ({VALUE}) should be below the regular price',
      },
    },
    slug: String,
    difficulty: {
      type: String,
      required: [true, 'Difficulty is required'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    images: [String],
    imageCover: String,
    rate: {
      type: Number,
      default: 0,
      validate: {
        validator: function (val) {
          return val <= 5 && val >= 0;
        },
        message: 'Rating must be between 0 and 5',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be above 0'],
      max: [5, 'Rating must be below 5'],
      set: val => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    startDate: [
      {
        type: Date,
        required: [true, 'Start date is required'],
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    active: {
      type: Boolean,
      default: true,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      }
    ],
  },
  {
    toJSON: { virtuals: true, id: false },
    toObject: { virtuals: true, id: false }
  }
);

// Indexes
dummySchema.index({ price: 1, rate: -1});
dummySchema.index({ slug: 1 });
dummySchema.index({ startLocation: '2dsphere' });

// virtual populate
dummySchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'dummy',
  localField: '_id',
});

dummySchema.pre(/^find/, function(next) {
  this.populate({ path: 'guides', select: 'name' });
  next();
})

dummySchema.pre("save", function(next) {
  this.slug = slugify(this.name, { lower: true });
  // console.log(this);
  next();
})


// dummySchema.pre('save', async function(next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id));

//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// add virtual properties
// dummySchema.virtual('rateDiv2').get( function(){
//   return this.rate / 2
// })


// Post middleware
// dummySchema.post("save", function(doc, next) {
//   console.log(doc);
//   next();
// })

// Query middleware
// dummySchema.pre(/^find/, function(next) {
//   this.find({ active: { $ne: false } });
//   next();
// })

// Aggregation middleware
// dummySchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { active: { $ne: false } } });
//   next();
// });

const Dummy = mongoose.model('Dummy', dummySchema);

module.exports = Dummy;
