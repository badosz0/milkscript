local __lua_print
__lua_print = function (text)
  print(text)
end
local print
print = function (args)
  __lua_print(args)
end
(
  function ()
    local __temp_0 = 'b'
    if (__temp_0 == 'a') then
      print('1')
    elseif (__temp_0 == 'b') then
      print('2')
    elseif (__temp_0 == 'c') then
      print('3')
    elseif (__temp_0 == 'd') then
      print('4')
    end
  end
)()