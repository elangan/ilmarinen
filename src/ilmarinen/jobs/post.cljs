(ns ilmarinen.jobs.post)


(defn valid-item?
  [item]
  (not (or (nil? item) (clojure.string/blank? item))))

((defn valid-quantity?
  [quantity]
  (not (or (nil? quantity) (> 0 quantity)))))

(defn valid?
  [{:keys [item quantity]}]
  (and (valid-item? item) (valid-quantity? quantity)))

(defn add-id
  [job]
  (conj event [:id (str (random-uuid))]))

(defn handle-name
  [job]
  (conj {:name (str (:item job) "-" (:id job))}))

(defn get-ingredients
  [item]
  {:athing "thing1" :bthing "thing2"})

(defn add-ingredients
  [job]
  (conj {:ingredients (get-ingredients (:item job)) job}))

(defn make-job
  [event]
  (let [job (dissoc event :autoassign)]
    (handle-name (add-ingredients (add-id job)))))



((defn ^:export handler
  [js_event contet]
  (let [event  (js->clj js-event)]
    (if (valid? event)
      (let [record (make-job event)]
        (persist record context))
      (.fail context "failed validation")))))
