/**
 * activity-log controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::activity-log.activity-log',({strapi})=>({
    async create(ctx){
        const user = ctx.state.user

        if(!user)
            return ctx.unauthorized('Login required');
        
        const body = ctx.request.body.data;
        body.users_permissions_user = user.id;

        const entry = await strapi.entityService.create('api::activity-log.activity-log',{
            data:body,
            populate:["users_permissions_user"]
        }
    )
    return { data: entry };
},
 async find(ctx){
        const user = ctx.state.user

        const result = await strapi.entityService.findMany('api::activity-log.activity-log',{
            filters:{users_permissions_user:user.id},
            populate:["users_permissions_user"]
        }
    )
    return { data: result };
},
async findOne(ctx){
        const user = ctx.state.user
        const {id} = ctx.params;

        const result = await strapi.entityService.findMany('api::activity-log.activity-log',{
            filters:{ documentId: id, users_permissions_user:user.id },
            populate:["users_permissions_user"]
        }
    )
    if(!result || result.length === 0) return ctx.notFound("Not Found or not yours") 
    return { data: result[0] };
}
    
}));
