import { TRPCError, initTRPC } from '@trpc/server/src';
import { expectTypeOf } from 'expect-type';

test('decorate independently', () => {
  type User = {
    id: string;
    name: string;
  };
  type Context = {
    user: User;
  };
  const t = initTRPC.context<Context>().create();

  const fooMiddleware = t.middleware((opts) => {
    expectTypeOf(opts.ctx.user).toEqualTypeOf<User>();
    //   ^?
    return opts.next({
      ctx: {
        // ...opts.ctx,
        foo: 'foo' as const,
      },
    });
  });

  const barMiddleware = fooMiddleware.pipe((opts) => {
    //                   ^?
    opts.ctx.foo;
    expectTypeOf(opts.ctx.user).toEqualTypeOf<User>();
    expectTypeOf(opts.ctx).toMatchTypeOf<{
      foo: 'foo';
    }>();
    //        ^?
    return opts.next({
      ctx: {
        bar: 'bar' as const,
      },
    });
  });

  const bazMiddleware = barMiddleware.pipe((opts) => {
    expectTypeOf(opts.ctx.user).toEqualTypeOf<User>();
    expectTypeOf(opts.ctx.foo).toMatchTypeOf<'foo'>();
    expectTypeOf(opts.ctx.bar).toMatchTypeOf<'bar'>();
    return opts.next({
      ctx: {
        baz: 'baz' as const,
      },
    });
  });

  // TODO
  // 1. test type in resolver
  // 2. snapshot ctx in resolver

  // // throw new Error('TODO')
  t.procedure.use(bazMiddleware._self).query(({ ctx }) => {
    expectTypeOf(ctx.user).toMatchTypeOf<User>();
  });
});

test('resolver context', () => {
  const t = initTRPC.create();

  const fooMiddleware = t.middleware((opts) => {
    return opts.next({
      ctx: {
        // ...opts.ctx,
        foo: 'foo' as const,
      },
    });
  });

  const barMiddleware = fooMiddleware.pipe((opts) => {
    //                   ^?
    opts.ctx.foo;
    expectTypeOf(opts.ctx).toMatchTypeOf<{
      foo: 'foo';
    }>();
    //        ^?
    return opts.next({
      ctx: {
        bar: 'bar' as const,
      },
    });
  });

  const testProcedure = t.procedure.use(barMiddleware._self);
  const testRouter = t.router({
    test: testProcedure.query(({ ctx }) => {
      expectTypeOf(ctx).toMatchTypeOf<{
        foo: 'foo';
        bar: 'bar';
      }>();
    }),
  });
});

test('meta', () => {
  type Meta = {
    permissions: string[];
  };
  const t = initTRPC.meta<Meta>().create();

  t.middleware(({ meta, next }) => {
    expectTypeOf(meta).toMatchTypeOf<Meta | undefined>();

    return next();
  });
});
