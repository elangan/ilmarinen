(ns ilmarinen-jobs.core
  (:require [ilmarinen.core :as core]))

(def table  "ilmarinen-jobs")

(defn persist
  [record context]
  (core/persist table record context))
