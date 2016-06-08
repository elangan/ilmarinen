(defproject ilmarinen "0.1.0-SNAPSHOT"
  :description "FIXME"
  :url "http://please.FIXME"
  :dependencies [[org.clojure/clojure            "1.8.0"]
                 [org.clojure/clojurescript      "1.8.34"]
                 [org.clojure/core.async         "0.2.374"]

                 [io.nervous/cljs-lambda         "0.3.0"]
                 [io.nervous/cljs-nodejs-externs "0.2.0"]]
  :plugins [[lein-cljsbuild "1.1.3"]
            [lein-npm       "0.6.0"]
            [lein-doo       "0.1.7-SNAPSHOT"]
            [io.nervous/lein-cljs-lambda "0.5.0"]]
  :npm {:dependencies [[source-map-support "0.4.0"]]}
  :source-paths ["src"]
  :cljs-lambda
  {:defaults      {:role "FIXME"}
   :resource-dirs ["static"]
   :functions
   [{:name   "ilmarinen-jobs-post"
     :invoke ilmarinen-jobs-post/handler}]}
  :cljsbuild
  {:builds [{:id "ilmarinen"
             :source-paths ["src"]
             :compiler {:output-to     "target/ilmarinen/ilmarinen.js"
                        :output-dir    "target/ilmarinen"
                        :source-map    "target/ilmarinen/ilmarinen.js.map"
                        :target        :nodejs
                        :language-in   :ecmascript5
                        :optimizations :advanced}}]})
