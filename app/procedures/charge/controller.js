import AbstractEditController from 'hospitalrun/controllers/abstract-edit-controller';
import Ember from 'ember';

export default AbstractEditController.extend({
  cancelAction: 'closeModal',
  newCharge: false,
  newPricingItem: false,
  requestingController: Ember.inject.controller('procedures/edit'),
  database: Ember.inject.service(),
  pricingList: Ember.computed.alias('requestingController.pricingList'),
  selectedItem: null,
  updateCapability: 'add_charge',

  title: function() {
    var isNew = this.get('model.isNew');
    if (isNew) {
      return this.get('i18n').t('procedures.titles.addChargeItem');
    }
    return this.get('i18n').t('procedures.titles.editChargeItem');
  }.property('model.isNew'),

  beforeUpdate: function() {
    var isNew = this.get('model.isNew');
    if (isNew) {
      this.set('newCharge', true);
    }
    return new Ember.RSVP.Promise((resolve, reject) => {
      var model = this.get('model');
      var pricingItem = model.get('pricingItem');
      var selectedItem = this.get('selectedItem');
      if (!Ember.isEmpty(selectedItem) && (Ember.isEmpty(pricingItem) || selectedItem.id !== pricingItem.get('id'))) {
        this.store.find('pricing', selectedItem.id).then((item) => {
          model.set('pricingItem', item);
          resolve();
        });
      } else {
        var newItem = false;
        var saveItem = false;
        if (Ember.isEmpty(pricingItem)) {
          pricingItem = this.store.createRecord('pricing', {
            name: model.get('itemName'),
            category: model.get('pricingCategory')
          });
          newItem = true;
          saveItem = true;
        } else {
          if (pricingItem.get('name') !== model.get('itemName')) {
            pricingItem.set('name', model.get('itemName'));
            saveItem = true;
          }
        }
        if (saveItem) {
          pricingItem.save().then(() => {
            var pricingList = this.get('pricingList');
            if (newItem) {
              pricingList.addObject({
                id: pricingItem.get('id'),
                name: pricingItem.get('name')
              });
              model.set('pricingItem', pricingItem);
            } else {
              var itemToUpdate = pricingList.findBy('id', pricingItem.get('id'));
              itemToUpdate.name = pricingItem.get('name');
            }
            resolve();
          }, reject);
        } else {
          resolve();
        }
      }
    });
  },

  afterUpdate: function(record) {
    if (this.get('newCharge')) {
      this.get('requestingController').send('addCharge', record);
    } else {
      this.send('closeModal');
    }
  }
});
