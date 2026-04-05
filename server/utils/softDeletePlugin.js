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

  // Temporarily disabling middleware to check if it fixes global "failed to load"
  /*
  schema.pre(/^find|countDocuments/, function (next) {
    if (this.getQuery && typeof this.getQuery === 'function') {
      const query = this.getQuery();
      if (query && query.isDeleted === undefined) {
        this.where('isDeleted').ne(true);
      }
    }
    next();
  });

  schema.pre('aggregate', function (next) {
    const pipeline = this.pipeline();
    if (pipeline.length > 0 && pipeline[0].$geoNear) {
      pipeline.splice(1, 0, { $match: { isDeleted: { $ne: true } } });
    } else {
      pipeline.unshift({ $match: { isDeleted: { $ne: true } } });
    }
    next();
  });
  */

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
