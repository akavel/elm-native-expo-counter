module Expo
    exposing
        ( beginnerProgram
        , Node
        , text
        -- , onApp
        )

--import Native.Expo
import VirtualDom


{-| -}
type alias Node msg
    = VirtualDom.Node msg


{-| -}
text : String -> Node msg
text s =
    VirtualDom.text s


-- {-| -}
-- onTouch : Decoder msg -> (msg -> Task Never ()) -> Task Never Never

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
    VirtualDom.program
-- TODO(akavel): program = VirtualDom.program
