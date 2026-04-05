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

  // Safe middleware for Queries (find, findOne, findOneAndUpdate, etc.)
  schema.pre(/^find|countDocuments/, function (next) {
    try {
      const query = typeof this.getQuery === 'function' ? this.getQuery() : {};
      
      // Only apply filter if it doesn't already have one for isDeleted
      if (query && query.isDeleted === undefined) {
        // Use $ne: true to include documents missing the field (legacy data)
        this.where({ isDeleted: { $ne: true } });
      }
      next();
    } catch (error) {
      console.error('SoftDelete Plugin (Find Error):', error);
      next();
    }
  });

  // Safe middleware for Aggregate
  schema.pre('aggregate', function (next) {
    try {
      const pipeline = typeof this.pipeline === 'function' ? this.pipeline() : [];
      if (Array.isArray(pipeline)) {
        // Check if geoNear is the first stage (it must remain first)
        const hasGeoNear = pipeline.length > 0 && pipeline[0].$geoNear;
        if (hasGeoNear) {
          pipeline.splice(1, 0, { $match: { isDeleted: { $ne: true } } });
        } else {
          pipeline.unshift({ $match: { isDeleted: { $ne: true } } });
        }
      }
      next();
    } catch (error) {
      console.error('SoftDelete Plugin (Aggregate Error):', error);
      next();
    }
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
