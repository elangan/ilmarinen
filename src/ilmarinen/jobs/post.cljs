(ns ilmarinen-jobs.post
  (:require [clojure.string :as string]
            [ilmarinen-jobs.core :as core]
            [cljs-lambda.util :refer [async-lambda-fn]]))


(defn valid-item?
  [item]
  (not (or (nil? item) (string/blank? item))))

((defn valid-quantity?
  [quantity]
  (not (or (nil? quantity) (> 0 quantity)))))

(defn valid?
  [{:keys [item quantity]}]
  (and (valid-item? item) (valid-quantity? quantity)))

(defn add-id
  [job]
  (conj job [:id (str (random-uuid))]))

(defn handle-name
  [job]
  (conj {:name (str (:item job) "-" (:id job))}))

(defn get-ingredients
  [item]
  {:athing "thing1" :bthing "thing2"})

(defn add-ingredients
  [job]
  (conj {:ingredients (get-ingredients (:item job))} job))

(defn make-job
  [event]
  (let [job (dissoc event :autoassign)]
    (handle-name (add-ingredients (add-id job)))))



((defn ^:export handler
  [js-event context]
  (let [event  (js->clj js-event)]
    (if (valid? event)
      (let [record (make-job event)]
        (core/persist record context))
      (.fail context "failed validation")))))
