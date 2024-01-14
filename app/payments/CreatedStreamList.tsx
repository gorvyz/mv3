import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import CountUp from "react-countup";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { is } from "date-fns/locale";

export type Stream = {
  sender: string;
  recipient: string;
  amountAptFloat: number;
  durationMilliseconds: number;
  startTimestampMilliseconds: number;
  streamId: number;
};

export default function CreatedStreamList(props: {
  isTxnInProgress: boolean;
  setTxn: (isTxnInProgress: boolean) => void;
}) {
  // Wallet state
  const { connected, account, signAndSubmitTransaction } = useWallet();
  // Toast state
  const { toast } = useToast();
  // Streams state
  const [streams, setStreams] = useState<Stream[]>([]);
  const [areStreamsLoading, setAreStreamsLoading] = useState(true);

  /* 
    Retrieve the streams from the module and set the streams state.
  */
  useEffect(() => {
    if (connected) {
      getSenderStreams().then((streams) => {
        setStreams(streams);
        setAreStreamsLoading(false);
      });
    }
  }, [account, connected, props.isTxnInProgress]);

  /*
    Cancels a selected stream.
  */
  const cancelStream = async (recipient: string) => {
    /*
      TODO #7: Validate the account is defined before continuing. If not, return.
    */
    if (!account) return;

    /* 
      TODO #8: Set the isTxnInProgress state to true. This will display the loading spinner.
    */
    props.setTxn(true);

    /*
      TODO #9: Make a request to the entry function `cancel_stream` to cancel the stream. 
      
      HINT: 
        - In case of an error, set the isTxnInProgress state to false and return.
        - In case of success, display a toast notification with the transaction hash.

      -- Toast notification --*/
    const payload = {
      type: "entry_function_payload",
      function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::cancel_stream`,
      type_arguments: [],
      arguments: [account.address, recipient],
    };

    try {
      const tx = await signAndSubmitTransaction(payload);
      tx &&
        toast({
          title: "Stream closed!",
          description: `Closed stream for ${`${recipient.slice(
            0,
            6
          )}...${recipient.slice(-4)}`}`,
          action: (
            <a
              href={`https://explorer.aptoslabs.com/txn/${tx.hash}?network=testnet`}
              target="_blank"
            >
              <ToastAction altText="View transaction">View txn</ToastAction>
            </a>
          ),
        });
    } catch (e) {
      props.setTxn(false);
      return;
    }

    /*
      TODO #10: Set the isTxnInProgress state to false. This will hide the loading spinner.
    */
    props.setTxn(false);
  };

  /* 
    Retrieves the sender streams. 
  */
  const getSenderStreams = async () => {
    /*
      TODO #4: Validate the account is defined before continuing. If not, return.
    */
    if (!account) return;

    /*
      TODO #5: Make a request to the view function `get_senders_streams` to retrieve the streams sent by 
            the user.
    */
    const payload = {
      function: `${process.env.MODULE_ADDRESS}::${process.env.MODULE_NAME}::get_senders_streams`,
      type_arguments: [],
      arguments: [account.address],
    };

    const response = await fetch(
      `https://fullnode.testnet.aptoslabs.com/v1/view`,
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();

    /* 
      TODO #6: Parse the response from the view request and create the streams array using the given 
            data. Return the new streams array.
            

      HINT:
        - Remember to convert the amount to floating point number
    */
    let sendersStreams = [];
    sendersStreams = data[0]?.map((address: string, index: number) => {
      return {
        sender: account.address,
        recipient: address,
        amountAptFloat: data[3][index] / 100000000,
        durationMilliseconds: data[2][index] * 1000,
        startTimeMilliseconds: data[1][index] * 1000,
        streamId: data[4][index],
      };
    });
    return sendersStreams;
  };

  return (
    <ScrollArea className="rounded-lg bg-neutral-400 border border-neutral-200 w-full">
      <div className="h-fit max-h-96 w-full">
        <Table className="w-full">
          <TableHeader className="bg-neutral-300">
            <TableRow className="uppercase text-xs font-matter hover:bg-neutral-300">
              <TableHead className="text-center">ID</TableHead>
              <TableHead className="text-center">Recipient</TableHead>
              <TableHead className="text-center">End date</TableHead>
              <TableHead className="text-center">Remaining amount</TableHead>
              <TableHead className="text-center">Cancel stream</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {
              /* 
                TODO #1: Add a skeleton loader when the streams are loading. Use the provided Skeleton component.

                HINT:
                  - Use the areStreamsLoading state to determine if the streams are loading.
                
                -- Skeleton loader -- */

              areStreamsLoading && (
                <TableRow>
                  <TableCell className="items-center">
                    <div className="flex flex-row justify-center items-center w-full">
                      <Skeleton className="h-4 w-4" />
                    </div>
                  </TableCell>
                  <TableCell className="items-center">
                    <div className="flex flex-row justify-center items-center w-full">
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell className="items-center">
                    <div className="flex flex-row justify-center items-center w-full">
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell className="items-center">
                    <div className="flex flex-row justify-center items-center w-full">
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell className="items-center">
                    <div className="flex flex-row justify-center items-center w-full">
                      <Skeleton className="h-8 w-12" />
                    </div>
                  </TableCell>
                </TableRow>
              )
            }
            {
              /* 
                TODO #2: Add a row to the table when there are no streams. Use the provided component
                          to display the message.

                HINT:
                  - Use the areStreamsLoading state to determine if the streams are loading.
                  - Use the streams state to determine if there are any streams.

                -- message component --*/
              !areStreamsLoading && streams.length === 0 && (
                <TableRow className="hover:bg-neutral-400">
                  <TableCell colSpan={5}>
                    <p className="break-normal text-center font-matter py-4 text-neutral-100">
                      You don&apos;t have any outgoing payments.
                    </p>
                  </TableCell>
                </TableRow>
              )
            }
            {
              // TODO #3: Add a row to the table for each stream in the streams array. Use the provided
              //           component to display the stream information.

              // HINT:
              //   - Use the areStreamsLoading state to determine if the streams are loading. Don't display
              //     the streams if they are loading.
              //   - Use the streams state to determine if there are any streams.

              // -- stream component --
              !areStreamsLoading &&
                streams.length > 0 &&
                streams.map((stream, index) => {
                  const endDate = new Date(
                    stream.startTimestampMilliseconds +
                      stream.durationMilliseconds
                  );

                  return (
                    <TableRow
                      key={index}
                      className="font-matter hover:bg-neutral-400"
                    >
                      <TableCell className="text-center">
                        {stream.streamId}
                      </TableCell>
                      <TableCell className="text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              {`${stream.recipient.slice(
                                0,
                                6
                              )}...${stream.recipient.slice(-4)}`}
                            </TooltipTrigger>
                            <TooltipContent>{stream.recipient}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-center">
                        {
                          // TODO: Display the end date of the stream. If the stream has not started,
                          //       display a message saying "Stream has not started". Use the provided
                          //       component to display the date.

                          // HINT:
                          //   - Use the startTimestampMilliseconds to determine if the stream has started.
                          //   - Use the durationMilliseconds and startTimestampMilliseconds to calculate
                          //     the end date.

                          // -- date component --
                          stream.startTimestampMilliseconds ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  {endDate.toLocaleDateString()}
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{endDate.toLocaleString()}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            // -- message component --
                            <p>
                              <i>Stream has not started</i>
                            </p>
                          )
                        }
                      </TableCell>
                      <TableCell className="font-mono text-center">
                        {
                          // TODO: Display the remaining amount of the stream. If the stream has not started,
                          //       display the full amount. Use the provided component to display the amount.

                          // HINT:
                          //   - Use the startTimestampMilliseconds to determine if the stream has started.
                          //   - Use the durationMilliseconds and startTimestampMilliseconds to determine if
                          //     the stream has finished.

                          // -- amount component (show when stream is completed) --
                          stream.startTimestampMilliseconds ? (
                            stream.durationMilliseconds +
                              stream.startTimestampMilliseconds >=
                            Date.now() ? (
                              <p>`{stream.amountAptFloat}` APT</p>
                            ) : (
                              // -- amount component (show when stream is not completed) --
                              <CountUp
                                start={stream.amountAptFloat}
                                end={0}
                                duration={stream.durationMilliseconds / 1000}
                                decimals={8}
                                decimal="."
                                suffix=" APT"
                                useEasing={false}
                              />
                            )
                          ) : (
                            // -- amount component (show when stream has not started) --
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  {stream.amountAptFloat} APT
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{stream.amountAptFloat} APT</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )
                        }
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          className="bg-red-800 hover:bg-red-700 text-white"
                          onClick={() => cancelStream(stream.recipient)}
                        >
                          Cancel
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
            }
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
}
