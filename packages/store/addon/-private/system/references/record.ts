import RSVP, { resolve } from 'rsvp';

import type { SingleResourceDocument } from '../../ts-interfaces/ember-data-json-api';
import type { StableRecordIdentifier } from '../../ts-interfaces/identifier';
import type { RecordInstance } from '../../ts-interfaces/record-instance';
import Reference, { internalModelForReference, REFERENCE_CACHE } from './reference';

/**
  @module @ember-data/store
*/

/**
   A `RecordReference` is a low-level API that allows users and
   addon authors to perform meta-operations on a record.

   @class RecordReference
   @public
   @extends Reference
*/
export default class RecordReference extends Reference {
  public get type(): string {
    return this.identifier().type;
  }

  private get _id(): string | null {
    let identifier = this.identifier();
    if (identifier) {
      return identifier.id;
    }

    return null;
  }

  /**
     The `id` of the record that this reference refers to.

     Together, the `type` and `id` properties form a composite key for
     the identity map.

     Example

     ```javascript
     let userRef = store.getReference('user', 1);

     userRef.id(); // '1'
     ```

     @method id
    @public
     @return {String} The id of the record.
  */
  id() {
    return this._id;
  }

  /**
     The `identifier` of the record that this reference refers to.

     Together, the `type` and `id` properties form a composite key for
     the identity map.

     Example

     ```javascript
     let userRef = store.getReference('user', 1);

     userRef.identifier(); // '1'
     ```

     @method identifier
    @public
     @return {String} The identifier of the record.
  */
  identifier(): StableRecordIdentifier {
    return REFERENCE_CACHE.get(this) as StableRecordIdentifier;
  }

  /**
     How the reference will be looked up when it is loaded. Currently
     this always returns `identity` to signify that a record will be
     loaded by its `type` and `id`.

     Example

     ```javascript
     const userRef = store.getReference('user', 1);

     userRef.remoteType(); // 'identity'
     ```

     @method remoteType
     @public
     @return {String} 'identity'
  */
  remoteType(): 'link' | 'id' | 'identity' {
    return 'identity';
  }

  /**
    This API allows you to provide a reference with new data. The
    simplest usage of this API is similar to `store.push`: you provide a
    normalized hash of data and the object represented by the reference
    will update.

    If you pass a promise to `push`, Ember Data will not ask the adapter
    for the data if another attempt to fetch it is made in the
    interim. When the promise resolves, the underlying object is updated
    with the new data, and the promise returned by *this function* is resolved
    with that object.

    For example, `recordReference.push(promise)` will be resolved with a
    record.

     Example

     ```javascript
     let userRef = store.getReference('user', 1);

     // provide data for reference
     userRef.push({
       data: {
         id: "1",
         type: "user",
         attributes: {
           username: "@user"
         }
       }
     }).then(function(user) {
       userRef.value() === user;
     });
     ```

    @method push
    @public
    @param objectOrPromise a JSON:API ResourceDocument or a promise resolving to one
    @return a promise for the value (record or relationship)
  */
  push(objectOrPromise: SingleResourceDocument | Promise<SingleResourceDocument>): RSVP.Promise<RecordInstance> {
    return resolve(objectOrPromise).then((data) => {
      return this.store.push(data);
    });
  }

  /**
    If the entity referred to by the reference is already loaded, it is
    present as `reference.value`. Otherwise the value returned by this function
    is `null`.

     Example

     ```javascript
     let userRef = store.getReference('user', 1);

     userRef.value(); // user
     ```

     @method value
    @public
     @return {Model} the record for this RecordReference
  */
  value(): RecordInstance | null {
    if (this._id !== null) {
      let internalModel = internalModelForReference(this);
      if (internalModel && internalModel.currentState.isLoaded) {
        return internalModel.getRecord();
      }
    }
    return null;
  }

  /**
     Triggers a fetch for the backing entity based on its `remoteType`
     (see `remoteType` definitions per reference type).

     Example

     ```javascript
     let userRef = store.getReference('user', 1);

     // load user (via store.find)
     userRef.load().then(...)
     ```

     @method load
    @public
     @return {Promise<record>} the record for this RecordReference
  */
  load() {
    if (this._id !== null) {
      return this.store.findRecord(this.type, this._id);
    }
    throw new Error(`Unable to fetch record of type ${this.type} without an id`);
  }

  /**
     Reloads the record if it is already loaded. If the record is not
     loaded it will load the record via `store.findRecord`

     Example

     ```javascript
     let userRef = store.getReference('user', 1);

     // or trigger a reload
     userRef.reload().then(...)
     ```

     @method reload
    @public
     @return {Promise<record>} the record for this RecordReference
  */
  reload() {
    if (this._id !== null) {
      return this.store.findRecord(this.type, this._id, { reload: true });
    }
    throw new Error(`Unable to fetch record of type ${this.type} without an id`);
  }
}
