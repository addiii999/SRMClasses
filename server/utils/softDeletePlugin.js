const softDeletePlugin = (schema) => {
  schema.add({
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: String,
      default: null
    }
  });

  // Most stable middleware approach for Queries
  schema.pre(/^find|countDocuments/, function (next) {
    if (this.getQuery && typeof this.getQuery === 'function') {
      const query = this.getQuery();
      // Only apply if not searching for deleted items explicitly
      if (query && query.isDeleted === undefined) {
        this.where('isDeleted').ne(true);
      }
    }
    next();
  });

  // Aggregation - More cautious unshift
  schema.pre('aggregate', function (next) {
    const pipeline = this.pipeline();
    // Safely inject match stage if it doesn't break geoNear or similar stages
    if (pipeline.length > 0 && pipeline[0].$geoNear) {
      pipeline.splice(1, 0, { $match: { isDeleted: { $ne: true } } });
    } else {
      pipeline.unshift({ $match: { isDeleted: { $ne: true } } });
    }
    next();
  });

  // Soft delete method
  schema.methods.softDelete = function (adminEmail) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = adminEmail || 'Admin';
    return this.save();
  };

  // Restore method
  schema.methods.restore = function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
  };
};

module.exports = softDeletePlugin;
