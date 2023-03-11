module Main where

import Concur.Core (Widget)
import Concur.React (HTML)
import Concur.React.DOM (div', text)
import Concur.React.Run (runWidgetInDom)
import Data.Unit (Unit)
import Effect (Effect)

newtype Point x y = Point { x :: Int, y :: Int }

newtype Widget v a = Widget (Free (WidgetStep v) a)

hello :: Widget HTML Unit
hello = div' [text "Hello Sailor!"]

main :: Effect Unit
main = runWidgetInDom "root" hello
