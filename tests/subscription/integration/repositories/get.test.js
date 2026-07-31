import {expect,it,beforeEach, beforeAll, afterAll} from 'vitest'
import {subscriptionRepository} from '../../../../src/repositories/subscription.repository.js'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { subscriptionRepository } from '../../../../src/repositories/subscription.repository.js'
import { resolvedSeller, resolvedUser, userSubscription } from '../../Fixtures.js'


let dbServer;
beforeAll(async()=>{
    dbServer = await MongoMemoryServer.create();
    await mongoose.connect(dbServer.getUri(),{dbName: "WearSuggest"});

})
afterAll(async()=>{
    await mongoose.disconnect();
    await dbServer.stop();
})
 let resolved;
 let subscription;


    beforeEach(async()=>{
        const userId = new mongoose.Types.ObjectId
        await mongoose.connection.collection("subscriptions").deleteMany({});
        resolved = resolvedUser({userId})
        subscription = userSubscription({userId})
        await subscriptionRepository.create({
            subscriber: resolved,
            subscription
        },{
            options:{validateBeforeSave: false}
        })
    });
    it("should return a subscription when found",async()=>{
        const result = await subscriptionRepository.get(resolved)
        expect(result).toMatchObject(subscription)
    })
    it("should return null",async()=>{
        const sellerId = new mongoose.Types.ObjectId
        const seller = resolvedSeller({sellerId})
        const result = await subscriptionRepository.get(seller)
        expect(result).toBeNull()
    })
