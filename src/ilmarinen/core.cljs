(ns ilmarinen.core)

(set! *main-cli-fn* identity)

(def aws (js/require "aws-sdk"))

(defn persist
  [table record context]
  (let [db (aws.DynamoDB.DocumentClient.)
        payload {:TableName table :Item record}]
    (let [request (.put db (clj->js payload))]
      (.on request "complete" (fn [response]
                                (if (.-error response)
                                  (.fail context (.-error (str "error: " response)))
                                  (.succeed context "OK"))))
      (.send request))))
