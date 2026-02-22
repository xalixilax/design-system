import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/Button";
import { type InferRequestType, type InferResponseType, hc } from "hono/client";
import { useState } from "react";

/** Hono backend types */
import type { AppType } from "../../../servers/api/src/index";

/** For global style */
import "@ui/styles/global.css";

/** Using content from other packages */
import { helloWorld } from "@shared/lib/utils";

/**
 * Hono RPC initialization for the client
 * @see https://hono.dev/docs/guides/rpc
 */

const client = hc<AppType>("http://localhost:3000/");

export function App() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<null | string>(null);

  /**
   * Sample react-query mutation
   * @see https://tanstack.com/query/latest/docs/framework/react/guides/mutations
   */
  const mutation = useMutation<
    InferResponseType<typeof client.posts.$post>,
    Error,
    InferRequestType<typeof client.posts.$post>["form"]
  >({
    mutationFn: async (todo) => {
      const res = await client.posts.$post({
        form: { ...todo },
      });
      return await res.json();
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      setState(res.message);
    },
    onError: (error) => {
      console.error("Did you forget to start your backend?", error);
    },
  });

  return (
    <div className="size-full flex flex-col items-center gap-4 p-4">
      <Button
        onClick={() => {
          mutation.mutate({
            title: "Hello",
            body: "Hono is a cool project",
          });
        }}
      >
        {helloWorld()}
      </Button>

      <div>{state}</div>
    </div>
  );
}
