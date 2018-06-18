module Expo
    exposing
        ( beginnerProgram
        , Node
        , text
        )

import Native.Expo


{-| -}
type Node msg
    = Node


{-| -}
text : String -> Node msg
text s =
    Native.Expo.text s


{-| -}
beginnerProgram :
    { model : model
    , view : model -> Node msg
    , update : msg -> model -> model
    }
    -> Program Never model msg
beginnerProgram {model, view, update} =
  program
    { init = (model, Cmd.none)
    , update = \msg model -> (update msg model, Cmd.none)
    , view = view
    , subscriptions = \_ -> Sub.none
    }
-- beginnerProgram =
--     Native.Expo.beginnerProgram


{-| -}
program :
    { view : model -> Node msg
    , update : msg -> model -> ( model, Cmd msg )
    , subscriptions : model -> Sub msg
    , init : ( model, Cmd msg )
    }
    -> Program Never model msg
program =
    Native.Expo.program
// TODO(akavel): program = VirtualDom.program
