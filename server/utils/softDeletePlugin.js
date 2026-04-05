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

  // Middleware for find queries
  schema.pre(/^find/, function (next) {
    if (this.getFilter().isDeleted === undefined) {
      this.where({ isDeleted: false });
    }
    next();
  });

  // Middleware for countDocuments
  schema.pre('countDocuments', function (next) {
    if (this.getFilter().isDeleted === undefined) {
      this.where({ isDeleted: false });
    }
    next();
  });

  // Middleware for aggregate (Note: This is a general match, can be overridden)
  schema.pre('aggregate', function (next) {
    this.pipeline().unshift({ $match: { isDeleted: false } });
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
